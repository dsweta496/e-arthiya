const mongoose = require("mongoose");
const ProcurementRequest = require("../models/ProcurementRequest");
const ProduceLot = require("../models/ProduceLot");
const SupplyIntent = require("../models/SupplyIntent");
const { findMatches, matchProcurementRequest, createFarmerOffer } = require("../services/matching.service");

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
function sendError(res, error, fallback = 400) {
  return res.status(error.statusCode || fallback).json({ success: false, message: error.message || "Request failed" });
}
async function getRequestForUser(req, requestId) {
  if (!mongoose.isValidObjectId(requestId)) throw httpError("Invalid procurement request ID", 400);
  const request = await ProcurementRequest.findById(requestId);
  if (!request) throw httpError("Procurement request not found", 404);
  if (req.user.role === "buyer" && request.buyer.toString() !== req.user._id.toString()) {
    throw httpError("You are not authorized to use this procurement request", 403);
  }
  return request;
}

const getMatches = async (req, res) => {
  try {
    const request = await getRequestForUser(req, req.params.procurementRequestId);
    const matches = await findMatches(request._id);
    return res.status(200).json({ success: true, procurementRequestId: request._id, count: matches.length, matches });
  } catch (error) {
    console.error("Find matches error:", error);
    return sendError(res, error, 400);
  }
};

const runMatching = async (req, res) => {
  try {
    await getRequestForUser(req, req.params.procurementRequestId);
    const result = await matchProcurementRequest(req.params.procurementRequestId);
    return res.status(200).json({
      success: true,
      message: result.newlyProposedQuantity > 0 ? "Matching proposals created; suppliers must approve them" : "No new proposals were created; existing proposals or allocations may already cover the available capacity",
      ...result,
    });
  } catch (error) {
    console.error("Run matching error:", error);
    return sendError(res, error, 400);
  }
};

const createFarmerOfferController = async (req, res) => {
  try {
    const request = await getRequestForUser(req, req.params.procurementRequestId);
    const { sourceType, sourceId, quantity, unit } = req.body || {};
    if (!mongoose.isValidObjectId(sourceId)) throw httpError("Valid source ID is required", 400);
    let source;
    if (sourceType === "lot") source = await ProduceLot.findById(sourceId);
    else if (sourceType === "supply_intent") source = await SupplyIntent.findById(sourceId);
    else throw httpError("Source type must be 'lot' or 'supply_intent'", 400);
    if (!source) throw httpError("Supply source not found", 404);
    if (source.farmer.toString() !== req.user._id.toString()) throw httpError("You can only offer produce from your own supply", 403);
    const allocation = await createFarmerOffer({
      procurementRequestId: request._id,
      farmerId: req.user._id,
      sourceType,
      sourceId,
      quantity: typeof quantity === "string" && quantity.trim() !== "" ? Number(quantity) : quantity,
      unit,
    });
    return res.status(201).json({ success: true, message: "Farmer offer sent to buyer for acceptance", allocation });
  } catch (error) {
    console.error("Create farmer offer error:", error);
    return sendError(res, error, 400);
  }
};

module.exports = { getMatches, runMatching, createFarmerOfferController };

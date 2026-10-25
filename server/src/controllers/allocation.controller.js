const { recordBlockchainAnchor } = require("../services/blockchainAnchor.service");
const mongoose = require("mongoose");
const Allocation = require("../models/Allocation");
const ProcurementRequest = require("../models/ProcurementRequest");
const ProduceLot = require("../models/ProduceLot");
const SupplyIntent = require("../models/SupplyIntent");
const Notification = require("../models/Notification");
const {
  createAllocation,
  approveAllocation,
  releaseAllocation,
  commitAllocation,
  fulfillAllocation,
  getAvailableQuantity,
} = require("../services/allocation.service");

const isValidId = (id) => mongoose.isValidObjectId(id);
function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
function sendError(res, error, fallback = 500) {
  return res.status(error.statusCode || fallback).json({ success: false, message: error.message || "Request failed" });
}

async function assertBuyerOwnsRequest(req, requestId) {
  // Accept either a raw ID or a populated Mongoose document.
  const normalizedRequestId = requestId && requestId._id ? requestId._id : requestId;
  if (!isValidId(normalizedRequestId)) throw httpError("Valid procurement request ID is required", 400);
  const request = await ProcurementRequest.findById(normalizedRequestId).select("buyer");
  if (!request) throw httpError("Procurement request not found", 404);
  if (req.user.role !== "admin" && request.buyer.toString() !== req.user._id.toString()) {
    throw httpError("You are not authorized to use this procurement request", 403);
  }
  return request;
}

async function getAllocationSource(allocation) {
  if (allocation.sourceType === "lot") return ProduceLot.findById(allocation.sourceId);
  if (allocation.sourceType === "supply_intent") return SupplyIntent.findById(allocation.sourceId);
  return null;
}

async function assertCanManageSource(req, source) {
  if (!source) throw httpError("Allocation source not found", 404);
  if (req.user.role === "admin") return;
  const userId = req.user._id.toString();
  if (req.user.role === "farmer" && source.farmer && source.farmer.toString() === userId) return;
  if (["fpo", "arthiya"].includes(req.user.role) && req.user.verificationStatus === "verified" &&
    source.aggregatorType === req.user.role && source.aggregator && source.aggregator.toString() === userId) return;
  throw httpError("You are not authorized to manage this supply source", 403);
}

async function assertCanAccessAllocation(req, allocation) {
  if (req.user.role === "admin") return;
  if (req.user.role === "buyer") {
    await assertBuyerOwnsRequest(req, allocation.procurementRequest);
    return;
  }
  const source = await getAllocationSource(allocation);
  await assertCanManageSource(req, source);
}

const createAllocationController = async (req, res) => {
  try {
    if (req.user.role !== "buyer") throw httpError("Only buyers can propose allocations", 403);
    const { procurementRequestId, farmerId, sourceType, sourceId, quantity, unit } = req.body || {};
    await assertBuyerOwnsRequest(req, procurementRequestId);
    const allocation = await createAllocation({ procurementRequestId, farmerId, sourceType, sourceId, quantity, unit });
    // Record proposal creation separately from reservation: quantity is not reserved until approval.
    const blockchain = await recordBlockchainAnchor({
      entityType: "allocation",
      entityId: allocation._id,
      eventType: "ALLOCATION_CREATED",
      payload: {
        allocationId: String(allocation._id),
        procurementRequestId: String(allocation.procurementRequest),
        sourceType: allocation.sourceType,
        sourceId: String(allocation.sourceId),
        quantity: allocation.allocatedQuantity,
        unit: allocation.unit,
        status: allocation.status,
      },
      recordedBy: req.user._id,
    });
    return res.status(201).json({ success: true, message: "Allocation proposal submitted for supplier approval", allocation, blockchain });
  } catch (error) { return sendError(res, error, 400); }
};

const approveAllocationController = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) throw httpError("Invalid allocation ID", 400);
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) throw httpError("Allocation not found", 404);
    if ((allocation.initiatedBy || "buyer") !== "buyer") throw httpError("Farmer-originated offers must be accepted by the requesting buyer", 409);
    const source = await getAllocationSource(allocation);
    await assertCanManageSource(req, source);
    const updated = await approveAllocation(req.params.id);
    // Keep the source listing in sync with its accepted proposal. A reserved
    // source is no longer advertised as freely available or eligible for auction.
    const approvedSource = await getAllocationSource(updated);
    if (approvedSource) {
      approvedSource.status = "reserved";
      await approvedSource.save();
    }
    const blockchain = await recordBlockchainAnchor({ entityType: "allocation", entityId: updated._id, eventType: "ALLOCATION_RESERVED", payload: { allocationId: String(updated._id), sourceType: updated.sourceType, sourceId: String(updated.sourceId), quantity: updated.allocatedQuantity, unit: updated.unit, status: updated.status, sourceStatus: approvedSource?.status || "reserved" }, recordedBy: req.user._id });
    return res.status(200).json({ success: true, message: "Allocation approved and quantity reserved", allocation: updated, blockchain });
  } catch (error) { return sendError(res, error, 400); }
};

const acceptFarmerOfferController = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) throw httpError("Invalid allocation ID", 400);
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) throw httpError("Allocation not found", 404);
    if ((allocation.initiatedBy || "buyer") !== "farmer") throw httpError("This allocation is not a farmer-originated offer", 409);
    if (req.user.role !== "admin") await assertBuyerOwnsRequest(req, allocation.procurementRequest);
    const updated = await approveAllocation(req.params.id);
    // Keep the source listing in sync with its accepted proposal. A reserved
    // source is no longer advertised as freely available or eligible for auction.
    const approvedSource = await getAllocationSource(updated);
    if (approvedSource) {
      approvedSource.status = "reserved";
      await approvedSource.save();
    }
    const blockchain = await recordBlockchainAnchor({ entityType: "allocation", entityId: updated._id, eventType: "ALLOCATION_RESERVED", payload: { allocationId: String(updated._id), sourceType: updated.sourceType, sourceId: String(updated.sourceId), quantity: updated.allocatedQuantity, unit: updated.unit, status: updated.status, sourceStatus: approvedSource?.status || "reserved" }, recordedBy: req.user._id });
    return res.status(200).json({ success: true, message: "Farmer offer accepted and quantity reserved", allocation: updated, blockchain });
  } catch (error) { return sendError(res, error, 400); }
};

const rejectAllocationController = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) throw httpError("Invalid allocation ID", 400);
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) throw httpError("Allocation not found", 404);
    if (allocation.status !== "proposed") throw httpError("Only proposed allocations can be rejected", 409);
    const source = await getAllocationSource(allocation);
    const isBuyer = req.user.role === "buyer" && allocation.initiatedBy === "farmer" && (await assertBuyerOwnsRequest(req, allocation.procurementRequest));
    if (!isBuyer) await assertCanManageSource(req, source);
    allocation.status = "rejected";
    await allocation.save();
    const recipient = isBuyer ? allocation.farmer : (await ProcurementRequest.findById(allocation.procurementRequest).select("buyer"))?.buyer;
    if (recipient) await Notification.create({ recipient, type: "allocation_rejected", title: "Allocation proposal rejected", message: "An allocation proposal was rejected.", entityType: "allocation", entityId: String(allocation._id) });
    return res.json({ success: true, message: "Allocation rejected and the other party notified", allocation });
  } catch (error) { return sendError(res, error, 400); }
};

const getAllocations = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "buyer") {
      const requests = await ProcurementRequest.find({ buyer: req.user._id }).select("_id").lean();
      filter.procurementRequest = { $in: requests.map((request) => request._id) };
    } else if (req.user.role === "farmer") {
      filter.farmer = req.user._id;
    } else if (["fpo", "arthiya"].includes(req.user.role)) {
      if (req.user.verificationStatus !== "verified") throw httpError("Organization verification is required", 403);
      const sourceFilter = { aggregator: req.user._id, aggregatorType: req.user.role };
      const [lots, intents] = await Promise.all([
        ProduceLot.find(sourceFilter).select("_id").lean(),
        SupplyIntent.find(sourceFilter).select("_id").lean(),
      ]);
      filter.$or = [
        { sourceType: "lot", sourceId: { $in: lots.map((item) => item._id) } },
        { sourceType: "supply_intent", sourceId: { $in: intents.map((item) => item._id) } },
      ];
    } else if (req.user.role !== "admin") {
      throw httpError("You are not authorized to view allocations", 403);
    }

    if (req.query.procurementRequest) {
      if (!isValidId(req.query.procurementRequest)) throw httpError("Invalid procurement request ID", 400);
      if (req.user.role === "buyer") await assertBuyerOwnsRequest(req, req.query.procurementRequest);
      filter.procurementRequest = req.query.procurementRequest;
    }
    if (req.query.farmer) {
      if (!isValidId(req.query.farmer)) throw httpError("Invalid farmer ID", 400);
      // Non-admin users cannot use query filters to broaden their visibility.
      if (req.user.role === "farmer" && req.query.farmer !== req.user._id.toString()) throw httpError("You can only view your own allocations", 403);
      filter.farmer = req.query.farmer;
    }
    if (req.query.sourceType) {
      if (!["lot", "supply_intent"].includes(req.query.sourceType)) throw httpError("Invalid source type", 400);
      filter.sourceType = req.query.sourceType;
    }
    if (req.query.sourceId) {
      if (!isValidId(req.query.sourceId)) throw httpError("Invalid source ID", 400);
      filter.sourceId = req.query.sourceId;
    }
    if (req.query.status) {
      const allowed = ["proposed", "reserved", "committed", "fulfilled", "released", "cancelled", "rejected"];
      if (!allowed.includes(req.query.status)) throw httpError("Invalid allocation status", 400);
      filter.status = req.query.status;
    }

    const allocations = await Allocation.find(filter)
      .populate("procurementRequest", "crop variety quantity unit requiredBy availabilityFrom buyer")
      .populate("farmer", "name phone role location")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: allocations.length, allocations });
  } catch (error) { return sendError(res, error, 500); }
};

const getAllocationById = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) throw httpError("Invalid allocation ID", 400);
    const allocation = await Allocation.findById(req.params.id)
      .populate("procurementRequest", "crop variety quantity unit requiredBy availabilityFrom buyer")
      .populate("farmer", "name phone role location");
    if (!allocation) throw httpError("Allocation not found", 404);
    await assertCanAccessAllocation(req, allocation);
    return res.status(200).json({ success: true, allocation });
  } catch (error) { return sendError(res, error, 500); }
};

const getAvailableQuantityController = async (req, res) => {
  try {
    const { sourceType, sourceId } = req.params;
    if (!isValidId(sourceId)) throw httpError("Invalid source ID", 400);
    const result = await getAvailableQuantity(sourceType, sourceId);
    // Quantity is marketplace data; no personal source fields are returned here.
    return res.status(200).json({ success: true, sourceType, sourceId, quantity: result.quantity, allocatedQuantity: result.allocatedQuantity, availableQuantity: result.availableQuantity, unit: result.unit });
  } catch (error) { return sendError(res, error, 400); }
};

const releaseAllocationController = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) throw httpError("Invalid allocation ID", 400);
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) throw httpError("Allocation not found", 404);
    await assertCanManageSource(req, await getAllocationSource(allocation));
    const updated = await releaseAllocation(req.params.id);
    const blockchain = await recordBlockchainAnchor({ entityType: "allocation", entityId: updated._id, eventType: "ALLOCATION_RELEASED", payload: { allocationId: String(updated._id), status: updated.status, releasedAt: updated.releasedAt ? new Date(updated.releasedAt).toISOString() : null }, recordedBy: req.user._id });
    return res.status(200).json({ success: true, message: "Allocation released successfully", allocation: updated, blockchain });
  } catch (error) { return sendError(res, error, 400); }
};

const commitAllocationController = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) throw httpError("Invalid allocation ID", 400);
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) throw httpError("Allocation not found", 404);
    if (req.user.role !== "admin") {
      if (req.user.role !== "buyer") throw httpError("Only the requesting buyer can commit this allocation", 403);
      await assertBuyerOwnsRequest(req, allocation.procurementRequest);
    }
    const updated = await commitAllocation(req.params.id);
    const blockchain = await recordBlockchainAnchor({ entityType: "allocation", entityId: updated._id, eventType: "ALLOCATION_COMMITTED", payload: { allocationId: String(updated._id), status: updated.status, quantity: updated.allocatedQuantity, unit: updated.unit }, recordedBy: req.user._id });
    return res.status(200).json({ success: true, message: "Allocation committed successfully", allocation: updated, blockchain });
  } catch (error) { return sendError(res, error, 400); }
};

const fulfillAllocationController = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) throw httpError("Invalid allocation ID", 400);
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) throw httpError("Allocation not found", 404);
    await assertCanManageSource(req, await getAllocationSource(allocation));
    const updated = await fulfillAllocation(req.params.id);
    const blockchain = await recordBlockchainAnchor({ entityType: "allocation", entityId: updated._id, eventType: "TRADE_FULFILLED", payload: { allocationId: String(updated._id), status: updated.status, quantity: updated.allocatedQuantity, unit: updated.unit }, recordedBy: req.user._id });
    return res.status(200).json({ success: true, message: "Allocation fulfilled successfully", allocation: updated, blockchain });
  } catch (error) { return sendError(res, error, 400); }
};

module.exports = {
  createAllocationController,
  approveAllocationController,
  rejectAllocationController,
  acceptFarmerOfferController,
  getAllocations,
  getAllocationById,
  getAvailableQuantityController,
  releaseAllocationController,
  commitAllocationController,
  fulfillAllocationController,
};

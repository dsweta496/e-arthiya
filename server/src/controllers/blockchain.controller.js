const mongoose = require("mongoose");
const { anchorTradeEvent, getAnchorStatus } = require("../services/blockchain.service");
const { retryBlockchainAnchor } = require("../services/blockchainAnchor.service");
const BlockchainAnchor = require("../models/BlockchainAnchor");
const Allocation = require("../models/Allocation");
const Auction = require("../models/Auction");
const Bid = require("../models/Bid");
const Commitment = require("../models/PurchaseCommitment");
const Payment = require("../models/PaymentTransaction");
const ExternalOffer = require("../models/ExternalOffer");
const ProduceLot = require("../models/ProduceLot");
const SupplyIntent = require("../models/SupplyIntent");
const SupplyPool = require("../models/SupplyPool");
const ProcurementRequest = require("../models/ProcurementRequest");

const id = (v) => String(v?._id || v || "");
const isSame = (a, b) => Boolean(a && b && id(a) === id(b));

async function canAccessEntity(req, entityType, entityId) {
  if (req.user.role === "admin") return true;
  const uid = id(req.user._id);
  if (entityType === "allocation") {
    const a = await Allocation.findById(entityId).lean(); if (!a) return false;
    const r = await ProcurementRequest.findById(a.procurementRequest).select("buyer").lean();
    let source = a.sourceType === "lot" ? await ProduceLot.findById(a.sourceId).lean() : await SupplyIntent.findById(a.sourceId).lean();
    return id(r?.buyer) === uid || id(a.farmer) === uid || id(source?.farmer) === uid || id(source?.aggregator) === uid;
  }
  if (entityType === "commitment") {
    const c = await Commitment.findById(entityId).lean(); if (!c) return false;
    if (id(c.buyer) === uid) return true;
    const [lot, intent, pool, request] = await Promise.all([
      c.lot ? ProduceLot.findById(c.lot).lean() : null,
      c.supplyIntent ? SupplyIntent.findById(c.supplyIntent).lean() : null,
      c.supplyPool ? SupplyPool.findById(c.supplyPool).lean() : null,
      c.procurementRequest ? ProcurementRequest.findById(c.procurementRequest).lean() : null,
    ]);
    return [lot?.farmer, lot?.aggregator, intent?.farmer, intent?.aggregator, pool?.aggregator, request?.buyer].some((v) => id(v) === uid) || Boolean(pool?.contributors?.some((x) => id(x.farmer) === uid));
  }
  if (entityType === "payment") {
    const p = await Payment.findById(entityId).lean(); if (!p) return false;
    if (id(p.payer) === uid || id(p.receiver) === uid) return true;
    return canAccessEntity(req, "commitment", p.commitment);
  }
  if (entityType === "auction") {
    const a = await Auction.findById(entityId).lean(); if (!a) return false;
    const lot = await ProduceLot.findById(a.lot).lean();
    const bid = a.highestBid ? await Bid.findById(a.highestBid).lean() : null;
    return [lot?.farmer, lot?.aggregator, bid?.buyer].some((v) => id(v) === uid);
  }
  if (entityType === "bid") {
    const b = await Bid.findById(entityId).lean(); if (!b) return false;
    if (id(b.buyer) === uid) return true;
    const a = await Auction.findById(b.auction).lean(); const lot = a ? await ProduceLot.findById(a.lot).lean() : null;
    return [lot?.farmer, lot?.aggregator].some((v) => id(v) === uid);
  }
  if (entityType === "external_offer") {
    const o = await ExternalOffer.findById(entityId).lean(); if (!o) return false;
    if (id(o.submittedByFarmer) === uid) return true;
    const a = await Auction.findById(o.auction).lean(); const lot = a ? await ProduceLot.findById(a.lot).lean() : null;
    return [lot?.farmer, lot?.aggregator].some((v) => id(v) === uid);
  }
  return false;
}

async function anchorTradeEventController(req, res) {
  try { return res.status(201).json(await anchorTradeEvent(req.body || {})); }
  catch (error) { return res.status(Number.isInteger(error.statusCode) ? error.statusCode : 502).json({ success: false, message: error.message || "Failed to anchor event on blockchain." }); }
}
async function getAnchorStatusController(req, res) {
  try { const result = await getAnchorStatus(req.params.eventId); return res.json({ success: true, ...result }); }
  catch (error) { return res.status(Number.isInteger(error.statusCode) ? error.statusCode : 502).json({ success: false, message: error.message || "Failed to read blockchain event status." }); }
}
async function getEntityAnchorsController(req, res) {
  try {
    const { entityType, entityId } = req.params;
    if (!/^[a-zA-Z0-9_-]{2,40}$/.test(entityType) || !entityId || entityId.length > 128) return res.status(400).json({ success: false, message: "Invalid entity reference" });
    if (!(await canAccessEntity(req, entityType, entityId))) return res.status(403).json({ success: false, message: "You are not authorized to view these blockchain proofs" });
    const anchors = await BlockchainAnchor.find({ entityType, entityId }).select("-payload").sort({ createdAt: -1 }).lean();
    return res.json({ success: true, count: anchors.length, data: anchors, explorerBaseUrl: "https://sepolia.etherscan.io/tx/" });
  } catch (error) { return res.status(500).json({ success: false, message: "Unable to retrieve blockchain proofs" }); }
}
async function retryAnchorController(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid anchor ID" });
    const result = await retryBlockchainAnchor(req.params.id);
    return res.json({ success: result.status === "anchored", ...result });
  } catch (error) { return res.status(Number.isInteger(error.statusCode) ? error.statusCode : 502).json({ success: false, message: error.message || "Unable to retry blockchain anchor" }); }
}
module.exports = { anchorTradeEventController, getAnchorStatusController, getEntityAnchorsController, retryAnchorController };

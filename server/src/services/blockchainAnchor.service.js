const { ethers } = require("ethers");
const BlockchainAnchor = require("../models/BlockchainAnchor");
const { anchorTradeEvent } = require("./blockchain.service");

const ALLOWED_EVENT_TYPES = new Set([
  "COMMITMENT_CREATED", "COMMITMENT_CONFIRMED", "COMMITMENT_WITHDRAWN",
  "DEPOSIT_RECORDED", "BALANCE_PAYMENT_RECORDED", "PAYMENT_REFUNDED",
  "TRADE_FULFILLED", "PAYMENT_SETTLED", "ALLOCATION_RESERVED",
  "ALLOCATION_RELEASED", "ALLOCATION_COMMITTED", "AUCTION_CLOSED",
  "BID_PLACED", "EXTERNAL_OFFER_SELECTED", "ALLOCATION_CREATED",
  "AUCTION_CREATED", "EXTERNAL_OFFER_CREATED"
]);


function canonicalJson(value) {
  const sort = (v) => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === "object") return Object.keys(v).sort().reduce((o, k) => { o[k] = sort(v[k]); return o; }, {});
    return v;
  };
  return JSON.stringify(sort(value));
}

async function recordBlockchainAnchor({ entityType, entityId, eventType, payload, recordedBy = null }) {
  try {
    if (!ALLOWED_EVENT_TYPES.has(eventType)) throw new Error(`Unsupported blockchain event type: ${eventType}`);
    if (!entityType || !/^[a-zA-Z0-9_-]{2,40}$/.test(entityType)) throw new Error("Invalid entityType");
    if (entityId === undefined || entityId === null || String(entityId).length > 128) throw new Error("Invalid entityId");
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Payload must be a plain object");

    const entityIdString = String(entityId);
    const eventId = ethers.id(`${entityType}:${entityIdString}:${eventType}`);
    const entityIdHash = ethers.id(`${entityType}:${entityIdString}`);
    const payloadHash = ethers.keccak256(ethers.toUtf8Bytes(canonicalJson(payload)));

    let anchor = await BlockchainAnchor.findOne({ entityType, entityId: entityIdString, eventType });
    if (anchor?.status === "anchored") return { status: "anchored", anchor };
    if (!anchor) {
      try {
        anchor = await BlockchainAnchor.create({ entityType, entityId: entityIdString, eventType, eventId, entityIdHash, payloadHash, payload, recordedBy, status: "pending" });
      } catch (e) {
        if (e.code !== 11000) throw e;
        anchor = await BlockchainAnchor.findOne({ entityType, entityId: entityIdString, eventType });
        if (anchor?.status === "anchored") return { status: "anchored", anchor };
      }
    }

    // Payload for a stable event key must not silently change between retries.
    if (anchor.payloadHash !== payloadHash) {
      anchor.status = "failed";
      anchor.lastError = "Payload changed for an existing event key; refusing to anchor different data.";
      await anchor.save();
      return { status: "failed", anchor, message: anchor.lastError };
    }

    anchor.status = "pending";
    anchor.attempts += 1;
    anchor.lastAttemptAt = new Date();
    anchor.lastError = null;
    await anchor.save();

    try {
      const result = await anchorTradeEvent({ entityType, entityId: entityIdString, eventType, payload });
      anchor.status = "anchored";
      anchor.transactionHash = result.transactionHash;
      anchor.blockNumber = result.blockNumber;
      anchor.contractAddress = result.contractAddress;
      anchor.network = result.network;
      anchor.lastError = null;
      await anchor.save();
      return { status: "anchored", anchor, chain: result };
    } catch (error) {
      // If the RPC response was lost after the transaction mined, check the contract's
      // duplicate marker before leaving the record pending/failed. The retry endpoint can reconcile later.
      anchor.status = "failed";
      anchor.lastError = String(error.message || "Blockchain anchoring failed").slice(0, 500);
      await anchor.save();
      return { status: "failed", anchor, message: anchor.lastError };
    }
  } catch (error) {
    console.error("Blockchain anchor persistence error:", error.message);
    return { status: "failed", message: String(error.message || "Anchor persistence failed").slice(0, 500) };
  }
}

async function retryBlockchainAnchor(anchorId) {
  const anchor = await BlockchainAnchor.findById(anchorId);
  if (!anchor) {
    const error = new Error("Blockchain anchor record not found"); error.statusCode = 404; throw error;
  }
  if (anchor.status === "anchored") return { status: "anchored", anchor };
  const full = await BlockchainAnchor.findById(anchorId).select("+payload");
  return recordBlockchainAnchor({ entityType: full.entityType, entityId: full.entityId, eventType: full.eventType, payload: full.payload, recordedBy: full.recordedBy });
}

module.exports = { recordBlockchainAnchor, retryBlockchainAnchor, ALLOWED_EVENT_TYPES };

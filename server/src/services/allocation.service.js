const mongoose = require("mongoose");
const Allocation = require("../models/Allocation");
const ProcurementRequest = require("../models/ProcurementRequest");
const ProduceLot = require("../models/ProduceLot");
const SupplyIntent = require("../models/SupplyIntent");

const CONSUMING_STATUSES = ["reserved", "committed", "fulfilled"];
const REQUEST_OPEN_STATUSES = ["draft", "open", "partially_fulfilled"];
const SOURCE_TYPES = ["lot", "supply_intent"];

function serviceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertObjectId(value, label) {
  if (!mongoose.isValidObjectId(value)) {
    throw serviceError(`Valid ${label} ID is required`, 400);
  }
}

function normalizeCrop(value) {
  return String(value || "").trim().toLowerCase();
}

function getSourceModel(sourceType) {
  if (sourceType === "lot") return ProduceLot;
  if (sourceType === "supply_intent") return SupplyIntent;
  throw serviceError("Invalid source type. Use 'lot' or 'supply_intent'.", 400);
}

async function getSourceQuantity(sourceType, sourceId, session = null) {
  assertObjectId(sourceId, "source");
  const SourceModel = getSourceModel(sourceType);
  let query = SourceModel.findById(sourceId);
  if (session) query = query.session(session);
  const source = await query;
  if (!source) throw serviceError(sourceType === "lot" ? "Produce lot not found" : "Supply intent not found", 404);

  const quantity = sourceType === "lot" ? source.quantity : source.expectedQuantity;
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw serviceError("Source has an invalid quantity", 409);
  }
  return {
    farmer: source.farmer,
    quantity,
    unit: source.unit,
    crop: source.crop,
    status: source.status,
    source,
  };
}

async function getAllocatedQuantity(sourceType, sourceId, session = null) {
  assertObjectId(sourceId, "source");
  if (!SOURCE_TYPES.includes(sourceType)) throw serviceError("Invalid source type", 400);
  const pipeline = [
    { $match: { sourceType, sourceId: new mongoose.Types.ObjectId(sourceId), status: { $in: CONSUMING_STATUSES } } },
    { $group: { _id: null, total: { $sum: "$allocatedQuantity" } } },
  ];
  let aggregate = Allocation.aggregate(pipeline);
  if (session) aggregate = aggregate.session(session);
  const result = await aggregate;
  return result[0]?.total || 0;
}

async function getRequestAllocatedQuantity(procurementRequestId, session = null) {
  assertObjectId(procurementRequestId, "procurement request");
  let aggregate = Allocation.aggregate([
    { $match: { procurementRequest: new mongoose.Types.ObjectId(procurementRequestId), status: { $in: CONSUMING_STATUSES } } },
    { $group: { _id: null, total: { $sum: "$allocatedQuantity" } } },
  ]);
  if (session) aggregate = aggregate.session(session);
  const result = await aggregate;
  return result[0]?.total || 0;
}


async function getProposedQuantityBySource(sourceType, sourceId) {
  assertObjectId(sourceId, "source");
  const result = await Allocation.aggregate([
    { $match: { sourceType, sourceId: new mongoose.Types.ObjectId(sourceId), status: "proposed" } },
    { $group: { _id: null, total: { $sum: "$allocatedQuantity" } } },
  ]);
  return result[0]?.total || 0;
}

async function getRequestProposedQuantity(procurementRequestId) {
  assertObjectId(procurementRequestId, "procurement request");
  const result = await Allocation.aggregate([
    { $match: { procurementRequest: new mongoose.Types.ObjectId(procurementRequestId), status: "proposed" } },
    { $group: { _id: null, total: { $sum: "$allocatedQuantity" } } },
  ]);
  return result[0]?.total || 0;
}

async function getAvailableQuantity(sourceType, sourceId) {
  const sourceData = await getSourceQuantity(sourceType, sourceId);
  const allocatedQuantity = await getAllocatedQuantity(sourceType, sourceId);
  return {
    ...sourceData,
    allocatedQuantity,
    availableQuantity: Math.max(sourceData.quantity - allocatedQuantity, 0),
  };
}

async function createAllocation({ procurementRequestId, farmerId, sourceType, sourceId, quantity, unit, initiatedBy = "buyer" }) {
  assertObjectId(procurementRequestId, "procurement request");
  assertObjectId(farmerId, "farmer");
  assertObjectId(sourceId, "source");
  if (!SOURCE_TYPES.includes(sourceType)) throw serviceError("Invalid source type", 400);
  if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
    throw serviceError("Allocation quantity must be a number greater than zero", 400);
  }
  if (!unit) throw serviceError("Allocation unit is required", 400);
  if (!["buyer", "farmer"].includes(initiatedBy)) throw serviceError("Invalid allocation initiator", 400);

  const request = await ProcurementRequest.findById(procurementRequestId);
  if (!request) throw serviceError("Procurement request not found", 404);
  if (!REQUEST_OPEN_STATUSES.includes(request.status)) {
    throw serviceError("This procurement request is not accepting allocations", 409);
  }

  const sourceData = await getSourceQuantity(sourceType, sourceId);
  if (sourceData.status !== "available") {
    throw serviceError("This supply source is not currently available for proposals", 409);
  }
  if (sourceData.farmer.toString() !== farmerId.toString()) {
    throw serviceError("Source does not belong to the specified farmer", 403);
  }
  if (sourceData.unit !== unit || request.unit !== unit) {
    throw serviceError("Allocation unit must match both source and procurement request", 400);
  }
  if (normalizeCrop(sourceData.crop) !== normalizeCrop(request.crop)) {
    throw serviceError("Source crop does not match the procurement request", 400);
  }
  const [consumedSource, proposedSource, consumedRequest, proposedRequest] = await Promise.all([
    getAllocatedQuantity(sourceType, sourceId),
    getProposedQuantityBySource(sourceType, sourceId),
    getRequestAllocatedQuantity(procurementRequestId),
    getRequestProposedQuantity(procurementRequestId),
  ]);
  const sourceProposalCapacity = sourceData.quantity - consumedSource - proposedSource;
  const requestProposalCapacity = request.quantity - consumedRequest - proposedRequest;
  if (quantity > sourceProposalCapacity) {
    throw serviceError(`Only ${Math.max(sourceProposalCapacity, 0)} ${unit} remains available for new proposals from this source`, 409);
  }
  if (quantity > requestProposalCapacity) {
    throw serviceError(`Only ${Math.max(requestProposalCapacity, 0)} ${unit} of unproposed demand remains`, 409);
  }

  // Proposals are soft holds: they prevent duplicate matching proposals but do not
  // count as reserved inventory. Final approval rechecks capacity transactionally.
  return Allocation.create({
    procurementRequest: procurementRequestId,
    farmer: farmerId,
    sourceType,
    sourceId,
    allocatedQuantity: quantity,
    unit,
    initiatedBy,
    status: "proposed",
  });
}

/*
 * Approval is performed in a MongoDB transaction. Both the source and request
 * documents are version-bumped inside the transaction to serialize approvals
 * sharing either resource. If the MongoDB deployment does not support
 * transactions, approval fails closed rather than risking over-allocation.
 */
async function approveAllocation(allocationId) {
  assertObjectId(allocationId, "allocation");
  const session = await mongoose.startSession();
  let approved;
  try {
    await session.withTransaction(async () => {
      const allocation = await Allocation.findById(allocationId).session(session);
      if (!allocation) throw serviceError("Allocation not found", 404);
      if (allocation.status !== "proposed") {
        throw serviceError("Only proposed allocations can be approved", 409);
      }

      const request = await ProcurementRequest.findById(allocation.procurementRequest).session(session);
      if (!request) throw serviceError("Procurement request not found", 404);
      if (!REQUEST_OPEN_STATUSES.includes(request.status)) {
        throw serviceError("This procurement request is no longer accepting allocations", 409);
      }

      const SourceModel = getSourceModel(allocation.sourceType);
      const sourceData = await getSourceQuantity(allocation.sourceType, allocation.sourceId, session);
      if (sourceData.status !== "available") {
        throw serviceError("This supply source is no longer available", 409);
      }
      if (sourceData.farmer.toString() !== allocation.farmer.toString()) {
        throw serviceError("Allocation source no longer matches the specified farmer", 409);
      }
      if (sourceData.unit !== allocation.unit || request.unit !== allocation.unit) {
        throw serviceError("Allocation unit no longer matches the source and request", 409);
      }
      if (normalizeCrop(sourceData.crop) !== normalizeCrop(request.crop)) {
        throw serviceError("Source crop no longer matches the procurement request", 409);
      }

      // Touch both shared documents so concurrent approvals for the same source
      // OR the same buyer request conflict and retry against fresh quantities.
      const sourceLock = await SourceModel.updateOne(
        { _id: allocation.sourceId },
        { $inc: { __v: 1 } },
        { session }
      );
      const requestLock = await ProcurementRequest.updateOne(
        { _id: request._id },
        { $inc: { __v: 1 } },
        { session }
      );
      if (sourceLock.matchedCount !== 1 || requestLock.matchedCount !== 1) {
        throw serviceError("Could not lock the source and request for approval", 409);
      }

      // Re-read totals inside the transaction after taking the shared-document write locks.
      // Keep operations sequential inside a MongoDB transaction; the driver does
      // not support parallel operations on one transaction session reliably.
      const sourceAllocated = await getAllocatedQuantity(
        allocation.sourceType,
        allocation.sourceId,
        session
      );
      const requestAllocated = await getRequestAllocatedQuantity(request._id, session);
      const sourceAvailable = sourceData.quantity - sourceAllocated;
      const requestRemaining = request.quantity - requestAllocated;

      if (sourceAvailable < allocation.allocatedQuantity) {
        throw serviceError(`Insufficient source quantity: ${Math.max(sourceAvailable, 0)} ${sourceData.unit} available`, 409);
      }
      if (requestRemaining < allocation.allocatedQuantity) {
        throw serviceError(`Procurement request has only ${Math.max(requestRemaining, 0)} ${request.unit} remaining to allocate`, 409);
      }

      const result = await Allocation.updateOne(
        { _id: allocation._id, status: "proposed" },
        { $set: { status: "reserved" } },
        { session }
      );
      if (result.modifiedCount !== 1) throw serviceError("Allocation status changed; refresh and try again", 409);
      approved = await Allocation.findById(allocation._id).session(session);
    });
    if (!approved) throw serviceError("Approval did not complete", 500);
    return approved;
  } catch (error) {
    // A standalone MongoDB deployment cannot run multi-document transactions.
    if (error.code === 20 || /Transaction numbers are only allowed|replica set|transactions are not supported/i.test(error.message || "")) {
      throw serviceError("Safe allocation approval requires MongoDB transactions. Use a replica-set deployment (MongoDB Atlas supports this) before approving allocations.", 503);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}

async function transitionAllocation(allocationId, fromStatuses, toStatus, extraSet = {}) {
  assertObjectId(allocationId, "allocation");
  const updated = await Allocation.findOneAndUpdate(
    { _id: allocationId, status: { $in: fromStatuses } },
    { $set: { status: toStatus, ...extraSet } },
    { new: true, runValidators: true }
  );
  if (updated) return updated;
  const exists = await Allocation.exists({ _id: allocationId });
  if (!exists) throw serviceError("Allocation not found", 404);
  const messageByTarget = {
    released: "Only reserved or committed allocations can be released",
    committed: "Only reserved allocations can be committed",
    fulfilled: "Only committed allocations can be fulfilled",
  };
  throw serviceError(messageByTarget[toStatus] || "Invalid allocation status transition", 409);
}

const releaseAllocation = (allocationId) =>
  transitionAllocation(allocationId, ["reserved", "committed"], "released", { releasedAt: new Date() });
const commitAllocation = (allocationId) =>
  transitionAllocation(allocationId, ["reserved"], "committed");
const fulfillAllocation = (allocationId) =>
  transitionAllocation(allocationId, ["committed"], "fulfilled");

module.exports = {
  getAllocatedQuantity,
  getRequestAllocatedQuantity,
  getProposedQuantityBySource,
  getRequestProposedQuantity,
  getSourceQuantity,
  getAvailableQuantity,
  createAllocation,
  approveAllocation,
  releaseAllocation,
  commitAllocation,
  fulfillAllocation,
};

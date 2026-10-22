const mongoose = require("mongoose");
const ProduceLot = require("../models/ProduceLot");
const SupplyIntent = require("../models/SupplyIntent");
const ProcurementRequest = require("../models/ProcurementRequest");
const {
  getAvailableQuantity,
  getRequestAllocatedQuantity,
  getRequestProposedQuantity,
  getProposedQuantityBySource,
  createAllocation,
  getSourceQuantity,
} = require("./allocation.service");

function serviceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
function normalize(value) {
  return String(value || "").trim().toLowerCase();
}
function validId(id, label) {
  if (!mongoose.isValidObjectId(id)) throw serviceError(`Valid ${label} ID is required`, 400);
}

async function findMatches(procurementRequestId) {
  validId(procurementRequestId, "procurement request");
  const request = await ProcurementRequest.findById(procurementRequestId);
  if (!request) throw serviceError("Procurement request not found", 404);

  const lots = await ProduceLot.find({
    unit: request.unit,
    status: "available",
    availableFrom: { $lte: request.requiredBy },
  }).sort({ availableFrom: 1, createdAt: 1 });

  const intents = await SupplyIntent.find({
    unit: request.unit,
    status: "available",
    expectedHarvestDate: { $lte: request.requiredBy, ...(request.availabilityFrom ? { $gte: request.availabilityFrom } : {}) },
  }).sort({ expectedHarvestDate: 1, createdAt: 1 });

  const matches = [];
  for (const [sourceType, sources] of [["lot", lots], ["supply_intent", intents]]) {
    for (const source of sources) {
      if (normalize(source.crop) !== normalize(request.crop)) continue;
      if (request.variety && normalize(source.variety) !== normalize(request.variety)) continue;
      const physical = await getAvailableQuantity(sourceType, source._id);
      const pending = await getProposedQuantityBySource(sourceType, source._id);
      const availableQuantity = Math.max(physical.availableQuantity - pending, 0);
      if (availableQuantity <= 0) continue;
      matches.push({
        sourceType,
        sourceId: source._id,
        farmer: source.farmer,
        crop: source.crop,
        variety: source.variety,
        availableQuantity,
        unit: source.unit,
        availableFrom: sourceType === "lot" ? source.availableFrom : source.expectedHarvestDate,
      });
    }
  }
  return matches;
}

async function matchProcurementRequest(procurementRequestId) {
  validId(procurementRequestId, "procurement request");
  const request = await ProcurementRequest.findById(procurementRequestId);
  if (!request) throw serviceError("Procurement request not found", 404);
  if (!["draft", "open", "partially_fulfilled"].includes(request.status)) {
    throw serviceError("Procurement request cannot be matched in its current status", 409);
  }

  const [consumed, proposed] = await Promise.all([
    getRequestAllocatedQuantity(procurementRequestId),
    getRequestProposedQuantity(procurementRequestId),
  ]);
  let remainingQuantity = Math.max(request.quantity - consumed - proposed, 0);
  const initialRemainingQuantity = remainingQuantity;
  const matches = await findMatches(procurementRequestId);
  const allocations = [];

  for (const match of matches) {
    if (remainingQuantity <= 0) break;
    const quantity = Math.min(remainingQuantity, match.availableQuantity);
    if (quantity <= 0) continue;
    try {
      const allocation = await createAllocation({
        procurementRequestId,
        farmerId: match.farmer,
        sourceType: match.sourceType,
        sourceId: match.sourceId,
        quantity,
        unit: request.unit,
        initiatedBy: "buyer",
      });
      allocations.push(allocation);
      remainingQuantity -= quantity;
    } catch (error) {
      // Capacity can change between preview and proposal creation. A conflict on
      // one source should not prevent trying the next compatible source.
      if (error.statusCode === 409) continue;
      throw error;
    }
  }

  const requestedQuantity = request.quantity;
  const alreadyConsumingQuantity = consumed;
  const existingProposedQuantity = proposed;
  const newlyProposedQuantity = allocations.reduce((sum, item) => sum + item.allocatedQuantity, 0);
  const remainingAfterRun = Math.max(requestedQuantity - alreadyConsumingQuantity - existingProposedQuantity - newlyProposedQuantity, 0);

  // Do not mark demand fulfilled based on proposals. Only downstream fulfilment
  // should represent completion; this matching step creates proposals only.
  return {
    procurementRequest: request,
    allocations,
    requestedQuantity,
    alreadyConsumingQuantity,
    existingProposedQuantity,
    newlyProposedQuantity,
    remainingQuantity: remainingAfterRun,
    fullyMatched: remainingAfterRun === 0,
    proposalOnly: true,
    previouslyUnproposedDemand: initialRemainingQuantity,
  };
}

async function createFarmerOffer({ procurementRequestId, farmerId, sourceType, sourceId, quantity, unit }) {
  validId(procurementRequestId, "procurement request");
  validId(farmerId, "farmer");
  validId(sourceId, "source");
  const request = await ProcurementRequest.findById(procurementRequestId);
  if (!request) throw serviceError("Procurement request not found", 404);
  if (!["open", "partially_fulfilled"].includes(request.status)) {
    throw serviceError("This procurement request is not accepting farmer offers", 409);
  }
  const source = await getSourceQuantity(sourceType, sourceId);
  if (source.farmer.toString() !== farmerId.toString()) {
    throw serviceError("You can only offer produce from your own supply", 403);
  }
  return createAllocation({ procurementRequestId, farmerId, sourceType, sourceId, quantity, unit, initiatedBy: "farmer" });
}

module.exports = { findMatches, matchProcurementRequest, createFarmerOffer };

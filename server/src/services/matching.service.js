const ProduceLot = require("../models/ProduceLot");
const SupplyIntent = require("../models/SupplyIntent");
const ProcurementRequest = require("../models/ProcurementRequest");

const {
  getAvailableQuantity,
  createAllocation,
} = require("./allocation.service");

const findMatches = async (procurementRequestId) => {
  const procurementRequest =
    await ProcurementRequest.findById(
      procurementRequestId
    );

  if (!procurementRequest) {
    throw new Error(
      "Procurement request not found"
    );
  }

  const {
    crop,
    variety,
    quantity,
    unit,
    availabilityFrom,
    requiredBy,
  } = procurementRequest;

  const matches = [];

  /*
   * 1. Find available Produce Lots
   */
  const lots = await ProduceLot.find({
    crop,
    ...(variety ? { variety } : {}),
    unit,
    status: "available",
    availableFrom: {
      $lte: requiredBy,
    },
  }).sort({
    availableFrom: 1,
    createdAt: 1,
  });

  for (const lot of lots) {
    if (
      lot.availableFrom &&
      lot.availableFrom > requiredBy
    ) {
      continue;
    }

    const availability =
      await getAvailableQuantity(
        "lot",
        lot._id
      );

    if (availability.availableQuantity <= 0) {
      continue;
    }

    matches.push({
      sourceType: "lot",
      sourceId: lot._id,
      farmer: lot.farmer,
      availableQuantity:
        availability.availableQuantity,
      unit: availability.unit,
      availableFrom:
        lot.availableFrom,
    });
  }

  /*
   * 2. Find available Supply Intents
   */
  const supplyIntents =
    await SupplyIntent.find({
      crop,
      ...(variety ? { variety } : {}),
      unit,
      status: "available",
      expectedHarvestDate: {
        $lte: requiredBy,
      },
      ...(availabilityFrom
        ? {
            expectedHarvestDate: {
              $gte: availabilityFrom,
              $lte: requiredBy,
            },
          }
        : {}),
    }).sort({
      expectedHarvestDate: 1,
      createdAt: 1,
    });

  for (const supplyIntent of supplyIntents) {
    const availability =
      await getAvailableQuantity(
        "supply_intent",
        supplyIntent._id
      );

    if (availability.availableQuantity <= 0) {
      continue;
    }

    matches.push({
      sourceType: "supply_intent",
      sourceId: supplyIntent._id,
      farmer: supplyIntent.farmer,
      availableQuantity:
        availability.availableQuantity,
      unit: availability.unit,
      availableFrom:
        supplyIntent.expectedHarvestDate,
    });
  }

  return matches;
};

/*
 * Match a procurement request and create
 * allocations until the demand is fulfilled
 * or available supply runs out.
 */
const matchProcurementRequest = async (
  procurementRequestId
) => {
  const procurementRequest =
    await ProcurementRequest.findById(
      procurementRequestId
    );

  if (!procurementRequest) {
    throw new Error(
      "Procurement request not found"
    );
  }

  if (
    !["draft", "open", "partially_fulfilled"].includes(
      procurementRequest.status
    )
  ) {
    throw new Error(
      "Procurement request cannot be matched in its current status"
    );
  }

  const matches = await findMatches(
    procurementRequestId
  );

  let remainingQuantity =
    procurementRequest.quantity;

  const allocations = [];

  for (const match of matches) {
    if (remainingQuantity <= 0) {
      break;
    }

    const allocationQuantity = Math.min(
      remainingQuantity,
      match.availableQuantity
    );

    if (allocationQuantity <= 0) {
      continue;
    }

    const allocation =
      await createAllocation({
        procurementRequestId,
        farmerId: match.farmer,
        sourceType: match.sourceType,
        sourceId: match.sourceId,
        quantity: allocationQuantity,
        unit: procurementRequest.unit,
      });

    allocations.push(allocation);

    remainingQuantity -= allocationQuantity;
  }

  const allocatedQuantity =
    procurementRequest.quantity -
    remainingQuantity;

  if (allocatedQuantity === 0) {
    procurementRequest.status = "open";
  } else if (
    allocatedQuantity <
    procurementRequest.quantity
  ) {
    procurementRequest.status =
      "partially_fulfilled";
  } else {
    procurementRequest.status = "fulfilled";
  }

  await procurementRequest.save();

  return {
    procurementRequest,
    allocations,
    requestedQuantity:
      procurementRequest.quantity,
    allocatedQuantity,
    remainingQuantity,
    fullyMatched:
      remainingQuantity === 0,
  };
};

module.exports = {
  findMatches,
  matchProcurementRequest,
};
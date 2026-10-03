const Allocation = require("../models/Allocation");
const ProcurementRequest = require("../models/ProcurementRequest");
const ProduceLot = require("../models/ProduceLot");
const SupplyIntent = require("../models/SupplyIntent");

/*
 * Only these allocation statuses consume/reserve source quantity.
 */
const ACTIVE_ALLOCATION_STATUSES = [
  "reserved",
  "committed",
];

/*
 * Get the quantity already allocated from a source.
 */
const getAllocatedQuantity = async (sourceType, sourceId) => {
  const result = await Allocation.aggregate([
    {
      $match: {
        sourceType,
        sourceId,
        status: {
          $in: ACTIVE_ALLOCATION_STATUSES,
        },
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: "$allocatedQuantity",
        },
      },
    },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

/*
 * Get the original quantity available from a source.
 */
const getSourceQuantity = async (sourceType, sourceId) => {
  if (sourceType === "lot") {
    const lot = await ProduceLot.findById(sourceId);

    if (!lot) {
      throw new Error("Produce lot not found");
    }

    return {
      farmer: lot.farmer,
      quantity: lot.quantity,
      unit: lot.unit,
      source: lot,
    };
  }

  if (sourceType === "supply_intent") {
    const supplyIntent = await SupplyIntent.findById(sourceId);

    if (!supplyIntent) {
      throw new Error("Supply intent not found");
    }

    return {
      farmer: supplyIntent.farmer,
      quantity: supplyIntent.expectedQuantity,
      unit: supplyIntent.unit,
      source: supplyIntent,
    };
  }

  throw new Error("Invalid source type");
};

/*
 * Calculate how much quantity is still available
 * from a ProduceLot or SupplyIntent.
 */
const getAvailableQuantity = async (sourceType, sourceId) => {
  const sourceData = await getSourceQuantity(
    sourceType,
    sourceId
  );

  const allocatedQuantity = await getAllocatedQuantity(
    sourceType,
    sourceId
  );

  const availableQuantity =
    sourceData.quantity - allocatedQuantity;

  return {
    ...sourceData,
    allocatedQuantity,
    availableQuantity: Math.max(availableQuantity, 0),
  };
};

/*
 * Create a new allocation safely.
 */
const createAllocation = async ({
  procurementRequestId,
  farmerId,
  sourceType,
  sourceId,
  quantity,
  unit,
}) => {
  if (!procurementRequestId) {
    throw new Error("Procurement request is required");
  }

  if (!farmerId) {
    throw new Error("Farmer is required");
  }

  if (!sourceType || !sourceId) {
    throw new Error("Source type and source ID are required");
  }

  if (!quantity || quantity <= 0) {
    throw new Error(
      "Allocation quantity must be greater than zero"
    );
  }

  const procurementRequest =
    await ProcurementRequest.findById(
      procurementRequestId
    );

  if (!procurementRequest) {
    throw new Error("Procurement request not found");
  }

  const sourceData = await getAvailableQuantity(
    sourceType,
    sourceId
  );

  if (
    sourceData.farmer.toString() !==
    farmerId.toString()
  ) {
    throw new Error(
      "Source does not belong to the specified farmer"
    );
  }

  if (sourceData.unit !== unit) {
    throw new Error(
      "Allocation unit does not match source unit"
    );
  }

  if (sourceData.availableQuantity < quantity) {
    throw new Error(
      `Insufficient available quantity. Only ${sourceData.availableQuantity} ${sourceData.unit} remains available`
    );
  }

  if (procurementRequest.unit !== unit) {
    throw new Error(
      "Allocation unit does not match procurement request unit"
    );
  }

  const allocation = await Allocation.create({
    procurementRequest: procurementRequestId,
    farmer: farmerId,
    sourceType,
    sourceId,
    allocatedQuantity: quantity,
    unit,
    status: "reserved",
  });

  return allocation;
};

/*
 * Release an existing allocation.
 */
const releaseAllocation = async (allocationId) => {
  const allocation =
    await Allocation.findById(allocationId);

  if (!allocation) {
    throw new Error("Allocation not found");
  }

  if (
    !ACTIVE_ALLOCATION_STATUSES.includes(
      allocation.status
    )
  ) {
    throw new Error(
      "Allocation is not currently active"
    );
  }

  allocation.status = "released";
  allocation.releasedAt = new Date();

  await allocation.save();

  return allocation;
};

/*
 * Mark an allocation as committed.
 */
const commitAllocation = async (allocationId) => {
  const allocation =
    await Allocation.findById(allocationId);

  if (!allocation) {
    throw new Error("Allocation not found");
  }

  if (allocation.status !== "reserved") {
    throw new Error(
      "Only reserved allocations can be committed"
    );
  }

  allocation.status = "committed";

  await allocation.save();

  return allocation;
};

/*
 * Mark an allocation as fulfilled.
 */
const fulfillAllocation = async (allocationId) => {
  const allocation =
    await Allocation.findById(allocationId);

  if (!allocation) {
    throw new Error("Allocation not found");
  }

  if (allocation.status !== "committed") {
    throw new Error(
      "Only committed allocations can be fulfilled"
    );
  }

  allocation.status = "fulfilled";

  await allocation.save();

  return allocation;
};

module.exports = {
  getAllocatedQuantity,
  getSourceQuantity,
  getAvailableQuantity,
  createAllocation,
  releaseAllocation,
  commitAllocation,
  fulfillAllocation,
};
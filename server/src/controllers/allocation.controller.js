const Allocation = require("../models/Allocation");
const {
  createAllocation,
  releaseAllocation,
  commitAllocation,
  fulfillAllocation,
  getAvailableQuantity,
} = require("../services/allocation.service");

// Create allocation
const createAllocationController = async (req, res) => {
  try {
    const {
      procurementRequestId,
      farmerId,
      sourceType,
      sourceId,
      quantity,
      unit,
    } = req.body;

    const allocation = await createAllocation({
      procurementRequestId,
      farmerId,
      sourceType,
      sourceId,
      quantity,
      unit,
    });

    return res.status(201).json({
      message: "Allocation created successfully",
      allocation,
    });
  } catch (error) {
    console.error("Create allocation error:", error);

    return res.status(400).json({
      message: error.message,
    });
  }
};

// Get allocations
const getAllocations = async (req, res) => {
  try {
    const {
      procurementRequest,
      farmer,
      sourceType,
      sourceId,
      status,
    } = req.query;

    const filter = {};

    if (procurementRequest) {
      filter.procurementRequest = procurementRequest;
    }

    if (farmer) {
      filter.farmer = farmer;
    }

    if (sourceType) {
      filter.sourceType = sourceType;
    }

    if (sourceId) {
      filter.sourceId = sourceId;
    }

    if (status) {
      filter.status = status;
    }

    const allocations = await Allocation.find(filter)
      .populate(
        "procurementRequest",
        "crop variety quantity unit requiredBy availabilityFrom"
      )
      .populate(
        "farmer",
        "name phone role location"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: allocations.length,
      allocations,
    });
  } catch (error) {
    console.error("Get allocations error:", error);

    return res.status(500).json({
      message: "Failed to fetch allocations",
      error: error.message,
    });
  }
};

// Get allocation by ID
const getAllocationById = async (req, res) => {
  try {
    const allocation = await Allocation.findById(
      req.params.id
    )
      .populate(
        "procurementRequest",
        "crop variety quantity unit requiredBy availabilityFrom"
      )
      .populate(
        "farmer",
        "name phone role location"
      );

    if (!allocation) {
      return res.status(404).json({
        message: "Allocation not found",
      });
    }

    return res.status(200).json(allocation);
  } catch (error) {
    console.error("Get allocation error:", error);

    return res.status(500).json({
      message: "Failed to fetch allocation",
      error: error.message,
    });
  }
};

// Get available quantity from a source
const getAvailableQuantityController = async (
  req,
  res
) => {
  try {
    const { sourceType, sourceId } = req.params;

    const result = await getAvailableQuantity(
      sourceType,
      sourceId
    );

    return res.status(200).json({
      sourceType,
      sourceId,
      quantity: result.quantity,
      allocatedQuantity: result.allocatedQuantity,
      availableQuantity: result.availableQuantity,
      unit: result.unit,
    });
  } catch (error) {
    console.error(
      "Get available quantity error:",
      error
    );

    return res.status(400).json({
      message: error.message,
    });
  }
};

// Release allocation
const releaseAllocationController = async (
  req,
  res
) => {
  try {
    const allocation =
      await releaseAllocation(req.params.id);

    return res.status(200).json({
      message: "Allocation released successfully",
      allocation,
    });
  } catch (error) {
    console.error(
      "Release allocation error:",
      error
    );

    return res.status(400).json({
      message: error.message,
    });
  }
};

// Commit allocation
const commitAllocationController = async (
  req,
  res
) => {
  try {
    const allocation =
      await commitAllocation(req.params.id);

    return res.status(200).json({
      message: "Allocation committed successfully",
      allocation,
    });
  } catch (error) {
    console.error(
      "Commit allocation error:",
      error
    );

    return res.status(400).json({
      message: error.message,
    });
  }
};

// Fulfill allocation
const fulfillAllocationController = async (
  req,
  res
) => {
  try {
    const allocation =
      await fulfillAllocation(req.params.id);

    return res.status(200).json({
      message: "Allocation fulfilled successfully",
      allocation,
    });
  } catch (error) {
    console.error(
      "Fulfill allocation error:",
      error
    );

    return res.status(400).json({
      message: error.message,
    });
  }
};

module.exports = {
  createAllocationController,
  getAllocations,
  getAllocationById,
  getAvailableQuantityController,
  releaseAllocationController,
  commitAllocationController,
  fulfillAllocationController,
};
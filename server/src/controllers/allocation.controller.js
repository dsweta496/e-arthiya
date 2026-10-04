const Allocation = require("../models/Allocation");
const ProcurementRequest = require("../models/ProcurementRequest");
const {
  createAllocation,
  releaseAllocation,
  commitAllocation,
  fulfillAllocation,
  getAvailableQuantity,
} = require("../services/allocation.service");

async function assertBuyerOwnsRequest(req, procurementRequestId) {
  if (req.user.role !== "buyer") return null;
  const request = await ProcurementRequest.findById(procurementRequestId).select("buyer");
  if (!request) throw new Error("Procurement request not found");
  if (request.buyer.toString() !== req.user._id.toString()) {
    const error = new Error("You are not authorized to use this procurement request");
    error.statusCode = 403;
    throw error;
  }
  return request;
}

async function assertBuyerOwnsAllocation(req, allocation) {
  if (req.user.role !== "buyer") return;
  const request = await ProcurementRequest.findById(allocation.procurementRequest).select("buyer");
  if (!request || request.buyer.toString() !== req.user._id.toString()) {
    const error = new Error("You are not authorized to modify this allocation");
    error.statusCode = 403;
    throw error;
  }
}

const createAllocationController = async (req, res) => {
  try {
    const { procurementRequestId, farmerId, sourceType, sourceId, quantity, unit } = req.body;
    await assertBuyerOwnsRequest(req, procurementRequestId);

    const allocation = await createAllocation({
      procurementRequestId,
      farmerId,
      sourceType,
      sourceId,
      quantity,
      unit,
    });

    return res.status(201).json({ message: "Allocation created successfully", allocation });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const getAllocations = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "buyer") {
      const ownRequests = await ProcurementRequest.find({ buyer: req.user._id }).select("_id");
      filter.procurementRequest = { $in: ownRequests.map((item) => item._id) };
    } else if (req.query.procurementRequest) {
      filter.procurementRequest = req.query.procurementRequest;
    }

    if (req.query.farmer) filter.farmer = req.query.farmer;
    if (req.query.sourceType) filter.sourceType = req.query.sourceType;
    if (req.query.sourceId) filter.sourceId = req.query.sourceId;
    if (req.query.status) filter.status = req.query.status;

    const allocations = await Allocation.find(filter)
      .populate("procurementRequest", "crop variety quantity unit requiredBy availabilityFrom buyer")
      .populate("farmer", "name phone role location")
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: allocations.length, allocations });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch allocations", error: error.message });
  }
};

const getAllocationById = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id)
      .populate("procurementRequest", "crop variety quantity unit requiredBy availabilityFrom buyer")
      .populate("farmer", "name phone role location");

    if (!allocation) return res.status(404).json({ message: "Allocation not found" });
    await assertBuyerOwnsAllocation(req, allocation);
    return res.status(200).json(allocation);
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getAvailableQuantityController = async (req, res) => {
  try {
    const { sourceType, sourceId } = req.params;
    const result = await getAvailableQuantity(sourceType, sourceId);
    return res.status(200).json({
      sourceType,
      sourceId,
      quantity: result.quantity,
      allocatedQuantity: result.allocatedQuantity,
      availableQuantity: result.availableQuantity,
      unit: result.unit,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const releaseAllocationController = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) return res.status(404).json({ message: "Allocation not found" });
    await assertBuyerOwnsAllocation(req, allocation);
    const updated = await releaseAllocation(req.params.id);
    return res.status(200).json({ message: "Allocation released successfully", allocation: updated });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const commitAllocationController = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) return res.status(404).json({ message: "Allocation not found" });
    await assertBuyerOwnsAllocation(req, allocation);
    const updated = await commitAllocation(req.params.id);
    return res.status(200).json({ message: "Allocation committed successfully", allocation: updated });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
};

const fulfillAllocationController = async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id);
    if (!allocation) return res.status(404).json({ message: "Allocation not found" });
    await assertBuyerOwnsAllocation(req, allocation);
    const updated = await fulfillAllocation(req.params.id);
    return res.status(200).json({ message: "Allocation fulfilled successfully", allocation: updated });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
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

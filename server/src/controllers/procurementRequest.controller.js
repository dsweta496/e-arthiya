const ProcurementRequest = require("../models/ProcurementRequest");
const User = require("../models/User");

const createProcurementRequest = async (req, res) => {
  try {
    const {
      crop,
      variety,
      quantity,
      unit,
      availabilityFrom,
      requiredBy,
      qualityRequirement,
      location,
      demandType,
    } = req.body;

    const buyer = req.user._id;

    if (!crop || !quantity || !unit || !availabilityFrom || !requiredBy || !demandType) {
      return res.status(400).json({
        success: false,
        message: "Crop, quantity, unit, availability window, required-by date and demand type are required",
      });
    }

    if (new Date(availabilityFrom) > new Date(requiredBy)) {
      return res.status(400).json({
        success: false,
        message: "Availability start cannot be after required-by date",
      });
    }

    const buyerUser = await User.findById(buyer);
    if (!buyerUser || buyerUser.role !== "buyer") {
      return res.status(403).json({
        success: false,
        message: "Only a buyer can create a procurement request",
      });
    }

    const procurementRequest = await ProcurementRequest.create({
      buyer,
      crop: crop.trim(),
      variety: variety?.trim(),
      quantity: Number(quantity),
      unit,
      availabilityFrom,
      requiredBy,
      qualityRequirement: qualityRequirement?.trim(),
      location,
      demandType,
      status: "open",
    });

    return res.status(201).json({
      success: true,
      message: "Procurement request created successfully",
      data: procurementRequest,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getProcurementRequests = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "buyer") {
      filter.buyer = req.user._id;
    } else if (req.query.buyer) {
      filter.buyer = req.query.buyer;
    }

    if (req.query.demandType) filter.demandType = req.query.demandType;
    if (req.query.status) filter.status = req.query.status;

    const procurementRequests = await ProcurementRequest.find(filter)
      .populate("buyer", "name phone role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: procurementRequests.length,
      data: procurementRequests,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getProcurementRequestById = async (req, res) => {
  try {
    const procurementRequest = await ProcurementRequest.findById(req.params.id)
      .populate("buyer", "name phone role");

    if (!procurementRequest) {
      return res.status(404).json({ success: false, message: "Procurement request not found" });
    }

    if (
      req.user.role === "buyer" &&
      procurementRequest.buyer?._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: "You are not authorized to view this requirement" });
    }

    return res.status(200).json({ success: true, data: procurementRequest });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateProcurementRequest = async (req, res) => {
  try {
    const procurementRequest = await ProcurementRequest.findById(req.params.id);

    if (!procurementRequest) {
      return res.status(404).json({ success: false, message: "Procurement request not found" });
    }

    if (procurementRequest.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "You can only update your own requirements" });
    }

    const allowedUpdates = [
      "crop",
      "variety",
      "quantity",
      "unit",
      "availabilityFrom",
      "requiredBy",
      "qualityRequirement",
      "location",
      "demandType",
    ];

    const updates = {};
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    if (req.body.status !== undefined) {
      const allowedStatuses = ["open", "cancelled"];
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ success: false, message: "Only open or cancelled status can be set manually" });
      }
      updates.status = req.body.status;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const start = updates.availabilityFrom || procurementRequest.availabilityFrom;
    const end = updates.requiredBy || procurementRequest.requiredBy;

    if (new Date(start) > new Date(end)) {
      return res.status(400).json({ success: false, message: "Availability start cannot be after required-by date" });
    }

    const updated = await ProcurementRequest.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Procurement request updated successfully",
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createProcurementRequest,
  getProcurementRequests,
  getProcurementRequestById,
  updateProcurementRequest,
};

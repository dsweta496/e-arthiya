const ProcurementRequest =
  require("../models/ProcurementRequest");

const User = require("../models/User");


// ========================================
// CREATE PROCUREMENT REQUEST
// ========================================

const createProcurementRequest = async (
  req,
  res
) => {
  try {
    const {
      buyer,
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

    // -----------------------------
    // REQUIRED FIELDS
    // -----------------------------

    if (
      !buyer ||
      !crop ||
      !quantity ||
      !unit ||
      !availabilityFrom ||
      !requiredBy ||
      !demandType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Buyer, crop, quantity, unit, availability window, required-by date and demand type are required",
      });
    }

    // -----------------------------
    // VALIDATE DATE WINDOW
    // -----------------------------

    if (
      new Date(availabilityFrom) >
      new Date(requiredBy)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Availability start cannot be after required-by date",
      });
    }

    // -----------------------------
    // VERIFY BUYER
    // -----------------------------

    const buyerUser =
      await User.findById(buyer);

    if (!buyerUser) {
      return res.status(404).json({
        success: false,
        message: "Buyer not found",
      });
    }

    if (buyerUser.role !== "buyer") {
      return res.status(400).json({
        success: false,
        message: "User is not a buyer",
      });
    }

    // -----------------------------
    // CREATE REQUEST
    // -----------------------------

    const procurementRequest =
      await ProcurementRequest.create({
        buyer,
        crop,
        variety,
        quantity,
        unit,
        availabilityFrom,
        requiredBy,
        qualityRequirement,
        location,
        demandType,
        status: "draft",
      });

    res.status(201).json({
      success: true,
      message:
        "Procurement request created successfully",
      data: procurementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET ALL PROCUREMENT REQUESTS
// ========================================

const getProcurementRequests = async (
  req,
  res
) => {
  try {
    const filter = {};

    if (req.query.buyer) {
      filter.buyer = req.query.buyer;
    }

    if (req.query.demandType) {
      filter.demandType =
        req.query.demandType;
    }

    if (req.query.status) {
      filter.status =
        req.query.status;
    }

    const procurementRequests =
      await ProcurementRequest.find(filter)
        .populate(
          "buyer",
          "name phone role"
        )
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count:
        procurementRequests.length,
      data: procurementRequests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET ONE PROCUREMENT REQUEST
// ========================================

const getProcurementRequestById = async (
  req,
  res
) => {
  try {
    const procurementRequest =
      await ProcurementRequest.findById(
        req.params.id
      ).populate(
        "buyer",
        "name phone role"
      );

    if (!procurementRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Procurement request not found",
      });
    }

    res.status(200).json({
      success: true,
      data: procurementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// UPDATE PROCUREMENT REQUEST
// ========================================

const updateProcurementRequest = async (
  req,
  res
) => {
  try {
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
      if (req.body[field] !== undefined) {
        updates[field] =
          req.body[field];
      }
    }

    if (
      Object.keys(updates).length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No valid fields to update",
      });
    }

    // -----------------------------
    // VALIDATE UPDATED DATE WINDOW
    // -----------------------------

    if (
      updates.availabilityFrom &&
      updates.requiredBy &&
      new Date(updates.availabilityFrom) >
        new Date(updates.requiredBy)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Availability start cannot be after required-by date",
      });
    }

    const procurementRequest =
      await ProcurementRequest.findByIdAndUpdate(
        req.params.id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!procurementRequest) {
      return res.status(404).json({
        success: false,
        message:
          "Procurement request not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Procurement request updated successfully",
      data: procurementRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createProcurementRequest,
  getProcurementRequests,
  getProcurementRequestById,
  updateProcurementRequest,
};
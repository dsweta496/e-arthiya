const SupplyIntent = require("../models/SupplyIntent");
const User = require("../models/User");

const createSupplyIntent = async (req, res) => {
  try {
    const {
      farmer,
      crop,
      variety,
      expectedQuantity,
      unit,
      expectedHarvestDate,
      supplyType,
      qualityExpectation,
      location,
      aggregatorType,
      aggregator,
    } = req.body;

    // -----------------------------
    // REQUIRED FIELDS
    // -----------------------------

    if (
      !farmer ||
      !crop ||
      !expectedQuantity ||
      !unit ||
      !expectedHarvestDate ||
      !supplyType
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Farmer, crop, quantity, unit, harvest date and supply type are required",
      });
    }

    // -----------------------------
    // VERIFY FARMER
    // -----------------------------

    const farmerUser = await User.findById(farmer);

    if (!farmerUser) {
      return res.status(404).json({
        success: false,
        message: "Farmer not found",
      });
    }

    if (farmerUser.role !== "farmer") {
      return res.status(400).json({
        success: false,
        message: "User is not a farmer",
      });
    }

    // -----------------------------
    // VERIFY AGGREGATOR
    // -----------------------------

    if (aggregator) {
      const aggregatorUser =
        await User.findById(aggregator);

      if (!aggregatorUser) {
        return res.status(404).json({
          success: false,
          message: "Aggregator not found",
        });
      }

      if (
        !["fpo", "arthiya"].includes(
          aggregatorUser.role
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Aggregator must be an FPO or Arthiya",
        });
      }

      if (
        aggregatorType === "direct"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Aggregator type cannot be direct when an aggregator is provided",
        });
      }
    }

    // -----------------------------
    // CREATE INTENT
    // -----------------------------

    const supplyIntent =
      await SupplyIntent.create({
        farmer,
        crop,
        variety,
        expectedQuantity,
        unit,
        expectedHarvestDate,
        supplyType,
        qualityExpectation,
        location,
        aggregatorType:
          aggregatorType || "direct",
        aggregator:
          aggregator || null,
        status: "draft",
      });

    res.status(201).json({
      success: true,
      message:
        "Supply intent created successfully",
      data: supplyIntent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET ALL SUPPLY INTENTS
// ========================================

const getSupplyIntents = async (
  req,
  res
) => {
  try {
    const filter = {};

    if (req.query.farmer) {
      filter.farmer = req.query.farmer;
    }

    if (req.query.supplyType) {
      filter.supplyType =
        req.query.supplyType;
    }

    if (req.query.status) {
      filter.status =
        req.query.status;
    }

    if (req.query.aggregatorType) {
      filter.aggregatorType =
        req.query.aggregatorType;
    }

    const supplyIntents =
      await SupplyIntent.find(filter)
        .populate(
          "farmer",
          "name phone role"
        )
        .populate(
          "aggregator",
          "name phone role"
        )
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: supplyIntents.length,
      data: supplyIntents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET ONE SUPPLY INTENT
// ========================================

const getSupplyIntentById = async (
  req,
  res
) => {
  try {
    const supplyIntent =
      await SupplyIntent.findById(
        req.params.id
      )
        .populate(
          "farmer",
          "name phone role"
        )
        .populate(
          "aggregator",
          "name phone role"
        );

    if (!supplyIntent) {
      return res.status(404).json({
        success: false,
        message:
          "Supply intent not found",
      });
    }

    res.status(200).json({
      success: true,
      data: supplyIntent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// UPDATE SUPPLY INTENT
// ========================================

const updateSupplyIntent = async (
  req,
  res
) => {
  try {
    const allowedUpdates = [
      "crop",
      "variety",
      "expectedQuantity",
      "unit",
      "expectedHarvestDate",
      "supplyType",
      "qualityExpectation",
      "location",
      "aggregatorType",
      "aggregator",
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
        message: "No valid fields to update",
      });
    }

    const supplyIntent =
      await SupplyIntent.findByIdAndUpdate(
        req.params.id,
        updates,
        {
          new: true,
          runValidators: true,
        }
      );

    if (!supplyIntent) {
      return res.status(404).json({
        success: false,
        message:
          "Supply intent not found",
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Supply intent updated successfully",
      data: supplyIntent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  createSupplyIntent,
  getSupplyIntents,
  getSupplyIntentById,
  updateSupplyIntent,
};
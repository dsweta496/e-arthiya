const ProduceLot = require("../models/ProduceLot");
const User = require("../models/User");

const createLot = async (req, res) => {
  try {
    const {
      farmer,
      crop,
      variety,
      quantity,
      unit,
      expectedPrice,
      harvestDate,
      qualityGrade,
      location,
      images,
      aggregatorType,
      aggregator,
      availableFrom,
    } = req.body;

    if (!farmer || !crop || !quantity || !unit) {
      return res.status(400).json({
        success: false,
        message:
          "Farmer, crop, quantity and unit are required",
      });
    }

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

    // If an FPO/Arthiya is facilitating the lot,
    // verify that the referenced user has the correct role.
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
    }

    if (req.user.role === "farmer" && req.user._id.toString() !== farmer.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only create supply for your own farmer account",
      });
    }

    const lot = await ProduceLot.create({
      farmer,
      crop,
      variety,
      quantity,
      unit,
      expectedPrice,
      harvestDate,
      qualityGrade,
      location,
      images,

      supplyType: "spot",

      aggregatorType:
        aggregatorType || "direct",

      aggregator:
        aggregator || null,

      availableFrom:
        availableFrom || Date.now(),

      status: "available",
    });

    res.status(201).json({
      success: true,
      message: "Produce lot created successfully",
      data: lot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getLots = async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === "farmer" && req.query.marketplace !== "true") {
      filter.farmer = req.user._id;
    } else if (req.query.farmer) {
      filter.farmer = req.query.farmer;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const lots = await ProduceLot.find(filter)
      .populate("farmer", "name phone location")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: lots.length,
      data: lots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getLotById = async (req, res) => {
  try {
    const lot = await ProduceLot.findById(
      req.params.id
    ).populate("farmer", "name phone location");

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Produce lot not found",
      });
    }

    res.status(200).json({
      success: true,
      data: lot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateLot = async (req, res) => {
  try {
    const allowedUpdates = [
      "crop",
      "variety",
      "quantity",
      "unit",
      "expectedPrice",
      "harvestDate",
      "qualityGrade",
      "location",
      "images",
      "status",
      "aggregatorType",
      "aggregator",
      "availableFrom",
    ];

    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const existingLot = await ProduceLot.findById(req.params.id);

    if (!existingLot) {
      return res.status(404).json({
        success: false,
        message: "Produce lot not found",
      });
    }

    if (req.user.role === "farmer" && existingLot.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own produce lots",
      });
    }

    const lot = await ProduceLot.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: "Produce lot not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Produce lot updated successfully",
      data: lot,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createLot,
  getLots,
  getLotById,
  updateLot,
};
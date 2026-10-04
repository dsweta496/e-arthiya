const SupplyPool = require("../models/SupplyPool");
const SupplyIntent = require("../models/SupplyIntent");
const ProduceLot = require("../models/ProduceLot");
const User = require("../models/User");

const createSupplyPool = async (req, res) => {
  try {
    const {
      crop,
      variety,
      unit,
      availabilityFrom,
      availabilityUntil,
      contributors,
    } = req.body;

    if (
      !crop ||
      !unit ||
      !availabilityFrom ||
      !availabilityUntil ||
      !Array.isArray(contributors) ||
      contributors.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Crop, unit, availability window and at least one contributor are required",
      });
    }

    if (new Date(availabilityFrom) > new Date(availabilityUntil)) {
      return res.status(400).json({
        success: false,
        message: "Availability start cannot be after availability end",
      });
    }

    const aggregator = req.user._id;
    const aggregatorType = req.user.role;

    if (!["fpo", "arthiya"].includes(aggregatorType)) {
      return res.status(403).json({
        success: false,
        message: "Only FPOs and Arthiyas can create supply pools",
      });
    }

    const validatedContributors = [];

    for (const contributor of contributors) {
      const { farmer, sourceType, sourceId, quantity } = contributor;

      if (!farmer || !sourceType || !sourceId || !quantity || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message:
            "Each contributor must have farmer, source type, source ID and positive quantity",
        });
      }

      const farmerUser = await User.findById(farmer);

      if (!farmerUser || farmerUser.role !== "farmer") {
        return res.status(400).json({
          success: false,
          message: `Invalid farmer ${farmer}`,
        });
      }

      let source;

      if (sourceType === "supply_intent") {
        source = await SupplyIntent.findById(sourceId);

        if (!source) {
          return res.status(404).json({
            success: false,
            message: `Supply intent ${sourceId} not found`,
          });
        }

        if (source.farmer.toString() !== farmer.toString()) {
          return res.status(400).json({
            success: false,
            message: "Supply intent does not belong to the specified farmer",
          });
        }

        if (source.status !== "available") {
          return res.status(400).json({
            success: false,
            message: "Only available supply intents can be pooled",
          });
        }

        if (source.crop.toLowerCase() !== crop.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: "Supply intent crop does not match pool crop",
          });
        }

        if (source.unit !== unit) {
          return res.status(400).json({
            success: false,
            message: "Supply intent unit does not match pool unit",
          });
        }

        if (quantity > source.expectedQuantity) {
          return res.status(400).json({
            success: false,
            message: "Pool quantity cannot exceed supply intent quantity",
          });
        }
      } else if (sourceType === "lot") {
        source = await ProduceLot.findById(sourceId);

        if (!source) {
          return res.status(404).json({
            success: false,
            message: `Produce lot ${sourceId} not found`,
          });
        }

        if (source.farmer.toString() !== farmer.toString()) {
          return res.status(400).json({
            success: false,
            message: "Produce lot does not belong to the specified farmer",
          });
        }

        if (source.status !== "available") {
          return res.status(400).json({
            success: false,
            message: "Only available produce lots can be pooled",
          });
        }

        if (source.crop.toLowerCase() !== crop.toLowerCase()) {
          return res.status(400).json({
            success: false,
            message: "Produce lot crop does not match pool crop",
          });
        }

        if (source.unit !== unit) {
          return res.status(400).json({
            success: false,
            message: "Produce lot unit does not match pool unit",
          });
        }

        if (quantity > source.quantity) {
          return res.status(400).json({
            success: false,
            message: "Pool quantity cannot exceed produce lot quantity",
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "sourceType must be lot or supply_intent",
        });
      }

      validatedContributors.push({
        farmer,
        sourceType,
        sourceId,
        quantity,
      });
    }

    const totalQuantity = validatedContributors.reduce(
      (total, contributor) => total + Number(contributor.quantity),
      0
    );

    const supplyPool = await SupplyPool.create({
      crop,
      variety,
      totalQuantity,
      unit,
      availabilityFrom,
      availabilityUntil,
      contributors: validatedContributors,
      aggregatorType,
      aggregator,
      procurementRequests: [],
      status: "forming",
    });

    return res.status(201).json({
      success: true,
      message: "Supply pool created successfully",
      data: supplyPool,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSupplyPools = async (req, res) => {
  try {
    const filter = {};

    if (req.query.crop) filter.crop = req.query.crop;
    if (req.query.status) filter.status = req.query.status;

    if (["fpo", "arthiya"].includes(req.user.role)) {
      filter.aggregator = req.user._id;
    } else if (req.query.aggregator) {
      filter.aggregator = req.query.aggregator;
    }

    if (req.query.aggregatorType) {
      filter.aggregatorType = req.query.aggregatorType;
    }

    const supplyPools = await SupplyPool.find(filter)
      .populate("contributors.farmer", "name phone role location")
      .populate("aggregator", "name phone role")
      .populate(
        "procurementRequests",
        "buyer crop quantity unit demandType status"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: supplyPools.length,
      data: supplyPools,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSupplyPoolById = async (req, res) => {
  try {
    const supplyPool = await SupplyPool.findById(req.params.id)
      .populate("contributors.farmer", "name phone role location")
      .populate("aggregator", "name phone role")
      .populate(
        "procurementRequests",
        "buyer crop quantity unit demandType status"
      );

    if (!supplyPool) {
      return res.status(404).json({
        success: false,
        message: "Supply pool not found",
      });
    }

    if (
      ["fpo", "arthiya"].includes(req.user.role) &&
      supplyPool.aggregator?._id?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this supply pool",
      });
    }

    return res.status(200).json({
      success: true,
      data: supplyPool,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSupplyPool,
  getSupplyPools,
  getSupplyPoolById,
};

const SupplyPool = require("../models/SupplyPool");
const SupplyIntent = require("../models/SupplyIntent");
const ProduceLot = require("../models/ProduceLot");
const User = require("../models/User");


// ========================================
// CREATE SUPPLY POOL
// ========================================

const createSupplyPool = async (req, res) => {
  try {
    const {
      crop,
      variety,
      unit,
      availabilityFrom,
      availabilityUntil,
      contributors,
      aggregatorType,
      aggregator,
    } = req.body;

    // -----------------------------
    // REQUIRED FIELDS
    // -----------------------------

    if (
      !crop ||
      !unit ||
      !availabilityFrom ||
      !availabilityUntil ||
      !contributors ||
      !Array.isArray(contributors) ||
      contributors.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Crop, unit, availability window and at least one contributor are required",
      });
    }

    // -----------------------------
    // VALIDATE DATE WINDOW
    // -----------------------------

    if (
      new Date(availabilityFrom) >
      new Date(availabilityUntil)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Availability start cannot be after availability end",
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
    }

    // -----------------------------
    // VALIDATE CONTRIBUTORS
    // -----------------------------

    const validatedContributors = [];

    for (const contributor of contributors) {
      const {
        farmer,
        sourceType,
        sourceId,
        quantity,
      } = contributor;

      if (
        !farmer ||
        !sourceType ||
        !sourceId ||
        !quantity ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each contributor must have farmer, source type, source ID and positive quantity",
        });
      }

      const farmerUser =
        await User.findById(farmer);

      if (!farmerUser) {
        return res.status(404).json({
          success: false,
          message:
            `Farmer ${farmer} not found`,
        });
      }

      if (farmerUser.role !== "farmer") {
        return res.status(400).json({
          success: false,
          message:
            `${farmer} is not a farmer`,
        });
      }

      // -----------------------------
      // VERIFY SOURCE
      // -----------------------------

      let source;

      if (sourceType === "supply_intent") {
        source =
          await SupplyIntent.findById(
            sourceId
          );

        if (!source) {
          return res.status(404).json({
            success: false,
            message:
              `Supply intent ${sourceId} not found`,
          });
        }

        if (
          source.farmer.toString() !==
          farmer.toString()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Supply intent does not belong to the specified farmer",
          });
        }

        if (
          source.crop.toLowerCase() !==
          crop.toLowerCase()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Supply intent crop does not match pool crop",
          });
        }

        if (source.unit !== unit) {
          return res.status(400).json({
            success: false,
            message:
              "Supply intent unit does not match pool unit",
          });
        }

        if (quantity > source.expectedQuantity) {
          return res.status(400).json({
            success: false,
            message:
              "Pool quantity cannot exceed supply intent quantity",
          });
        }
      }

      if (sourceType === "lot") {
        source =
          await ProduceLot.findById(
            sourceId
          );

        if (!source) {
          return res.status(404).json({
            success: false,
            message:
              `Produce lot ${sourceId} not found`,
          });
        }

        if (
          source.farmer.toString() !==
          farmer.toString()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Produce lot does not belong to the specified farmer",
          });
        }

        if (
          source.crop.toLowerCase() !==
          crop.toLowerCase()
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Produce lot crop does not match pool crop",
          });
        }

        if (source.unit !== unit) {
          return res.status(400).json({
            success: false,
            message:
              "Produce lot unit does not match pool unit",
          });
        }

        if (quantity > source.quantity) {
          return res.status(400).json({
            success: false,
            message:
              "Pool quantity cannot exceed produce lot quantity",
          });
        }
      }

      validatedContributors.push({
        farmer,
        sourceType,
        sourceId,
        quantity,
      });
    }

    // -----------------------------
    // CALCULATE TOTAL
    // -----------------------------

    const totalQuantity =
      validatedContributors.reduce(
        (total, contributor) =>
          total + contributor.quantity,
        0
      );

    // -----------------------------
    // CREATE POOL
    // -----------------------------

    const supplyPool =
      await SupplyPool.create({
        crop,
        variety,
        totalQuantity,
        unit,
        availabilityFrom,
        availabilityUntil,
        contributors:
          validatedContributors,
        aggregatorType:
          aggregatorType || "direct",
        aggregator:
          aggregator || null,
        procurementRequests: [],
        status: "forming",
      });

    res.status(201).json({
      success: true,
      message:
        "Supply pool created successfully",
      data: supplyPool,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET ALL SUPPLY POOLS
// ========================================

const getSupplyPools = async (req, res) => {
  try {
    const filter = {};

    if (req.query.crop) {
      filter.crop = req.query.crop;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.aggregatorType) {
      filter.aggregatorType =
        req.query.aggregatorType;
    }

    const supplyPools =
      await SupplyPool.find(filter)
        .populate(
          "contributors.farmer",
          "name phone role"
        )
        .populate(
          "aggregator",
          "name phone role"
        )
        .populate(
          "procurementRequests",
          "buyer crop quantity unit demandType status"
        )
        .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: supplyPools.length,
      data: supplyPools,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// GET ONE SUPPLY POOL
// ========================================

const getSupplyPoolById = async (req, res) => {
  try {
    const supplyPool =
      await SupplyPool.findById(
        req.params.id
      )
        .populate(
          "contributors.farmer",
          "name phone role"
        )
        .populate(
          "aggregator",
          "name phone role"
        )
        .populate(
          "procurementRequests",
          "buyer crop quantity unit demandType status"
        );

    if (!supplyPool) {
      return res.status(404).json({
        success: false,
        message:
          "Supply pool not found",
      });
    }

    res.status(200).json({
      success: true,
      data: supplyPool,
    });
  } catch (error) {
    res.status(500).json({
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
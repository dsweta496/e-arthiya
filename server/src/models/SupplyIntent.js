const mongoose = require("mongoose");

const supplyIntentSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    crop: {
      type: String,
      required: true,
      trim: true,
    },

    variety: {
      type: String,
      trim: true,
    },

    expectedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["kg", "quintal", "tonne"],
      required: true,
    },

    expectedHarvestDate: {
      type: Date,
      required: true,
    },

    supplyType: {
      type: String,
      enum: ["spot", "preorder"],
      required: true,
    },

    qualityExpectation: {
      type: String,
      trim: true,
    },

    location: {
      state: String,
      district: String,
      village: String,
    },

    aggregatorType: {
      type: String,
      enum: ["direct", "fpo", "arthiya"],
      default: "direct",
    },

    aggregator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "available",
        "committed",
        "converted",
        "cancelled",
      ],
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SupplyIntent",
  supplyIntentSchema
);
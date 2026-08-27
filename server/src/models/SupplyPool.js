const mongoose = require("mongoose");

const supplyPoolSchema = new mongoose.Schema(
  {
    crop: {
      type: String,
      required: true,
      trim: true,
    },

    variety: {
      type: String,
      trim: true,
    },

    totalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["kg", "quintal", "tonne"],
      required: true,
    },

    contributors: [
      {
        farmer: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        sourceType: {
          type: String,
          enum: ["lot", "supply_intent"],
          required: true,
        },

        sourceId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

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

    procurementRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProcurementRequest",
      },
    ],
    availabilityFrom: {
      type: Date,
      required: true,
    },

    availabilityUntil: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "forming",
        "ready",
        "in_auction",
        "committed",
        "partially_fulfilled",
        "fulfilled",
        "cancelled",
      ],
      default: "forming",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "SupplyPool",
  supplyPoolSchema
);
const mongoose = require("mongoose");

const procurementRequestSchema = new mongoose.Schema(
  {
    buyer: {
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

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["kg", "quintal", "tonne"],
      required: true,
    },

    requiredBy: {
      type: Date,
      required: true,
    },

    qualityRequirement: {
      type: String,
      trim: true,
    },

    location: {
      state: String,
      district: String,
      village: String,
    },

    demandType: {
      type: String,
      enum: ["spot", "forward"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "open",
        "partially_fulfilled",
        "fulfilled",
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
  "ProcurementRequest",
  procurementRequestSchema
);
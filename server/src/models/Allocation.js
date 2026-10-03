const mongoose = require("mongoose");

const allocationSchema = new mongoose.Schema(
  {
    procurementRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProcurementRequest",
      required: true,
    },

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

    allocatedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      enum: ["kg", "quintal", "tonne"],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "reserved",
        "committed",
        "fulfilled",
        "released",
        "cancelled",
      ],
      default: "reserved",
    },

    allocatedAt: {
      type: Date,
      default: Date.now,
    },

    releasedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

allocationSchema.index({
  procurementRequest: 1,
  status: 1,
});

allocationSchema.index({
  sourceType: 1,
  sourceId: 1,
  status: 1,
});

module.exports = mongoose.model(
  "Allocation",
  allocationSchema
);
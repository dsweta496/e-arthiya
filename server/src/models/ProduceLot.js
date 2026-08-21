const mongoose = require("mongoose");

const produceLotSchema = new mongoose.Schema(
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

    expectedPrice: {
      type: Number,
      min: 0,
    },

    harvestDate: {
      type: Date,
    },

    qualityGrade: {
      type: String,
      trim: true,
    },

    location: {
      state: String,
      district: String,
      village: String,
    },

    images: [
      {
        type: String,
      },
    ],

    status: {
      type: String,
      enum: [
        "draft",
        "available",
        "in_auction",
        "committed",
        "sold",
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
  "ProduceLot",
  produceLotSchema
);
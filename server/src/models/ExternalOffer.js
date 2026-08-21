const mongoose = require("mongoose");

const externalOfferSchema = new mongoose.Schema(
  {
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
    },

    offeredAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    buyerName: {
      type: String,
      required: true,
      trim: true,
    },

    buyerPhone: {
      type: String,
      trim: true,
    },

    submittedByFarmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    evidence: [
      {
        type: String,
      },
    ],

    status: {
      type: String,
      enum: [
        "recorded",
        "selected",
        "rejected",
      ],
      default: "recorded",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ExternalOffer",
  externalOfferSchema
);
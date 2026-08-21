const mongoose = require("mongoose");

const auctionSchema = new mongoose.Schema(
  {
    lot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProduceLot",
      required: true,
      unique: true,
    },

    startTime: {
      type: Date,
      required: true,
    },

    endTime: {
      type: Date,
      required: true,
    },

    startingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    currentHighestBid: {
      type: Number,
      default: 0,
      min: 0,
    },

    highestBid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bid",
      default: null,
    },

    selectedExternalOffer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExternalOffer",
      default: null,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "open",
        "closed_platform_winner",
        "closed_external_offer",
        "cancelled",
      ],
      default: "draft",
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Auction",
  auctionSchema
);
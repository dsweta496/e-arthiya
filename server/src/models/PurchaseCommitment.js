const mongoose = require("mongoose");

const purchaseCommitmentSchema =
  new mongoose.Schema(
    {
      auction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auction",
        required: true,
        unique: true,
      },

      lot: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProduceLot",
        required: true,
      },

      source: {
        type: String,
        enum: [
          "platform_bid",
          "external_offer",
        ],
        required: true,
      },

      buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      externalBuyerName: {
        type: String,
        default: null,
      },

      externalBuyerPhone: {
        type: String,
        default: null,
      },

      agreedPrice: {
        type: Number,
        required: true,
        min: 0,
      },

      quantity: {
        type: Number,
        required: true,
        min: 0,
      },

      status: {
        type: String,
        enum: [
          "created",
          "confirmed",
          "settled",
          "cancelled",
        ],
        default: "created",
      },

      blockchainTxHash: {
        type: String,
        default: null,
      },
    },
    {
      timestamps: true,
    }
  );

module.exports = mongoose.model(
  "PurchaseCommitment",
  purchaseCommitmentSchema
);
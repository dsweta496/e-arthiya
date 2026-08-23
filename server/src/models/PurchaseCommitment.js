const mongoose = require("mongoose");

const purchaseCommitmentSchema = new mongoose.Schema(
  {
    // Existing auction reference.
    // Optional now because future/direct commitments
    // may not originate from an auction.
    auction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
      default: null,
    },

    // Existing physical lot reference.
    // Optional because the commitment may instead
    // use a future supply intent or aggregated pool.
    lot: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProduceLot",
      default: null,
    },

    // Future supply reference.
    supplyIntent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupplyIntent",
      default: null,
    },

    // Aggregated supply reference.
    supplyPool: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupplyPool",
      default: null,
    },

    // Buyer requirement that this commitment fulfills.
    procurementRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProcurementRequest",
      default: null,
    },

    // How the price/commitment originated.
    source: {
      type: String,
      enum: [
        "platform_bid",
        "external_offer",
        "forward_commitment",
        "direct_commitment",
      ],
      required: true,
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Used when the buyer is outside the platform.
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

    unit: {
      type: String,
      enum: ["kg", "quintal", "tonne"],
      default: "quintal",
    },

    // Proposed MVP commitment protection.
    depositPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },

    depositAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    commitmentWindowEndsAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "created",
        "pending_deposit",
        "confirmed",
        "active",
        "fulfilled",
        "settled",
        "cancelled",
        "defaulted",
        "re_matching",
        "reallocated",
        "spot_rerouted",
        "flash_sale",
      ],
      default: "created",
    },

    // Used when something goes wrong with the original commitment.
    failureReason: {
      type: String,
      default: null,
      trim: true,
    },

    // Tracks whether the supply needs another buyer.
    reroutingStatus: {
      type: String,
      enum: [
        "not_required",
        "pending",
        "re_matched",
        "spot",
        "flash_sale",
        "resolved",
      ],
      default: "not_required",
    },

    // Settlement information.
    settlement: {
      cropValue: {
        type: Number,
        min: 0,
        default: 0,
      },

      farmerAmount: {
        type: Number,
        min: 0,
        default: 0,
      },

      serviceFee: {
        type: Number,
        min: 0,
        default: 0,
      },

      facilitatorCommission: {
        type: Number,
        min: 0,
        default: 0,
      },

      platformFee: {
        type: Number,
        min: 0,
        default: 0,
      },

      depositApplied: {
        type: Number,
        min: 0,
        default: 0,
      },

      settledAt: {
        type: Date,
        default: null,
      },
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
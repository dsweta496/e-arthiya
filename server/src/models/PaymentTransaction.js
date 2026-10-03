const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema(
  {
    commitment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseCommitment",
      required: true,
    },

    payer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: [
        "security_deposit",
        "balance_payment",
        "refund",
        "settlement",
      ],
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
        "cancelled",
      ],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: [
        "demo",
        "upi",
        "bank_transfer",
        "gateway",
        "blockchain",
      ],
      default: "demo",
    },

    transactionReference: {
      type: String,
      default: null,
      trim: true,
    },

    blockchainTxHash: {
      type: String,
      default: null,
      trim: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentTransactionSchema.index({
  commitment: 1,
  type: 1,
});

paymentTransactionSchema.index({
  payer: 1,
  status: 1,
});

module.exports = mongoose.model(
  "PaymentTransaction",
  paymentTransactionSchema
);
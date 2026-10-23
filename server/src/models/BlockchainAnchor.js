const mongoose = require("mongoose");

const blockchainAnchorSchema = new mongoose.Schema({
  entityType: { type: String, required: true, trim: true, maxlength: 40 },
  entityId: { type: String, required: true, trim: true, maxlength: 128 },
  eventType: { type: String, required: true, trim: true, maxlength: 48 },
  eventId: { type: String, required: true, unique: true, index: true },
  entityIdHash: { type: String, required: true },
  payloadHash: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true, select: false },
  transactionHash: { type: String, default: null },
  blockNumber: { type: Number, default: null },
  contractAddress: { type: String, default: null },
  network: { type: String, default: null },
  status: { type: String, enum: ["pending", "anchored", "failed"], default: "pending", index: true },
  attempts: { type: Number, default: 0, min: 0 },
  lastError: { type: String, default: null, maxlength: 500 },
  lastAttemptAt: { type: Date, default: null },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

blockchainAnchorSchema.index({ entityType: 1, entityId: 1, eventType: 1 }, { unique: true });
blockchainAnchorSchema.index({ status: 1, updatedAt: 1 });

module.exports = mongoose.model("BlockchainAnchor", blockchainAnchorSchema);

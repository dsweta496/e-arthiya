const mongoose = require("mongoose");
const schema = new mongoose.Schema({ recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true }, type: { type: String, required: true, maxlength: 60 }, title: { type: String, required: true, maxlength: 160 }, message: { type: String, required: true, maxlength: 500 }, entityType: { type: String, default: null }, entityId: { type: String, default: null }, readAt: { type: Date, default: null } }, { timestamps: true });
schema.index({ recipient: 1, readAt: 1, createdAt: -1 });
module.exports = mongoose.model("Notification", schema);

const express = require("express");
const {
  anchorTradeEventController,
  getAnchorStatusController,
} = require("../controllers/blockchain.controller");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

// Deliberately admin-only for the first vertical slice: anchoring is a privileged
// backend action, not a public wallet endpoint. Never accept a private key from a request.
router.post("/anchor", protect, authorizeRoles("admin"), anchorTradeEventController);
router.get("/status/:eventId", protect, authorizeRoles("admin"), getAnchorStatusController);

module.exports = router;

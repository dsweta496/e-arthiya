const express = require("express");
const { anchorTradeEventController, getAnchorStatusController, getEntityAnchorsController, retryAnchorController } = require("../controllers/blockchain.controller");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");
const router = express.Router();
// Manual anchor is admin-only. Business-event anchors are created server-side after state changes.
router.post("/anchor", protect, authorizeRoles("admin"), anchorTradeEventController);
router.get("/status/:eventId", protect, authorizeRoles("admin"), getAnchorStatusController);
router.get("/anchors/:entityType/:entityId", protect, getEntityAnchorsController);
router.post("/anchors/:id/retry", protect, authorizeRoles("admin"), retryAnchorController);
module.exports = router;
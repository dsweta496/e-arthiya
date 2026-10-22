const express = require("express");
const { getMatches, runMatching, createFarmerOfferController } = require("../controllers/matching.controller");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

// Preserve existing match-preview endpoint and role access.
router.get("/:procurementRequestId", protect, authorizeRoles("buyer", "farmer", "fpo", "arthiya"), getMatches);

// Preserve existing matching execution endpoint.
router.post("/:procurementRequestId/run", protect, authorizeRoles("buyer", "fpo", "arthiya"), runMatching);

// Farmers can offer their own supply against an open buyer request.
router.post("/:procurementRequestId/farmer-offer", protect, authorizeRoles("farmer"), createFarmerOfferController);

module.exports = router;

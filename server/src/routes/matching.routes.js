const express = require("express");

const {
  getMatches,
  runMatching,
} = require("../controllers/matching.controller");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Preview possible matches
router.get(
  "/:procurementRequestId",
  protect,
  authorizeRoles(
    "buyer",
    "farmer",
    "fpo",
    "arthiya"
  ),
  getMatches
);

// Execute matching and create allocations
router.post(
  "/:procurementRequestId/run",
  protect,
  authorizeRoles(
    "buyer",
    "fpo",
    "arthiya"
  ),
  runMatching
);

module.exports = router;
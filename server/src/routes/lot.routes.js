const express = require("express");

const {
  createLot,
  getLots,
  getLotById,
  updateLot,
} = require("../controllers/lot.controller");

const {
  protect,
  authorizeRoles,
  requireVerifiedOrganization,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Farmer / FPO / Arthiya can create lots
router.post(
  "/",
  protect,
  authorizeRoles("farmer", "fpo", "arthiya"),
  requireVerifiedOrganization,
  createLot
);

// Authenticated users can view lots
router.get(
  "/",
  protect,
  getLots
);

router.get(
  "/:id",
  protect,
  getLotById
);

// Owner/role validation remains in controller for now
router.patch(
  "/:id",
  protect,
  authorizeRoles("farmer", "fpo", "arthiya"),
  requireVerifiedOrganization,
  updateLot
);
module.exports = router;
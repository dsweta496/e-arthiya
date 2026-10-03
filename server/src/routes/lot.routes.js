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
} = require("../middleware/auth.middleware");

const router = express.Router();

// Farmer / FPO / Arthiya can create lots
router.post(
  "/",
  protect,
  authorizeRoles("farmer", "fpo", "arthiya"),
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
  updateLot
);

module.exports = router;
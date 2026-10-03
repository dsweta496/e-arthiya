const express = require("express");

const {
  createSupplyIntent,
  getSupplyIntents,
  getSupplyIntentById,
  updateSupplyIntent,
} = require("../controllers/supplyIntent.controller");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Create supply intent — Farmer only
router.post(
  "/",
  protect,
  authorizeRoles("farmer"),
  createSupplyIntent
);

// Get supply intents — Any authenticated user
router.get(
  "/",
  protect,
  getSupplyIntents
);

// Get single supply intent — Any authenticated user
router.get(
  "/:id",
  protect,
  getSupplyIntentById
);

// Update supply intent — Farmer only
router.patch(
  "/:id",
  protect,
  authorizeRoles("farmer"),
  updateSupplyIntent
);

module.exports = router;
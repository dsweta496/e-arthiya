const express = require("express");

const {
  createSupplyIntent,
  getSupplyIntents,
  getSupplyIntentById,
  updateSupplyIntent,
} = require("../controllers/supplyIntent.controller");

const router = express.Router();

router.post("/", createSupplyIntent);

router.get("/", getSupplyIntents);

router.get("/:id", getSupplyIntentById);

router.patch("/:id", updateSupplyIntent);

module.exports = router;
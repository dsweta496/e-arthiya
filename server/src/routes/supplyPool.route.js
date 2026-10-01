const express = require("express");

const {
  createSupplyPool,
  getSupplyPools,
  getSupplyPoolById,
} = require("../controllers/supplyPool.controller");

const router = express.Router();

router.post("/", createSupplyPool);

router.get("/", getSupplyPools);

router.get("/:id", getSupplyPoolById);

module.exports = router;
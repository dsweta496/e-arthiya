const express = require("express");

const {
  createSupplyPool,
  getSupplyPools,
  getSupplyPoolById,
} = require("../controllers/supplyPool.controller");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("fpo", "arthiya"),
  createSupplyPool
);

router.get(
  "/",
  protect,
  getSupplyPools
);

router.get(
  "/:id",
  protect,
  getSupplyPoolById
);

module.exports = router;
const express = require("express");

const {
  createSupplyPool,
  getSupplyPools,
  getSupplyPoolById,
} = require("../controllers/supplyPool.controller");

const {
  protect,
  authorizeRoles,
  requireVerifiedOrganization,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.post(
  "/",
  protect,
  authorizeRoles("fpo", "arthiya"),
  requireVerifiedOrganization,
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
const express = require("express");

const {
  createAllocationController,
  getAllocations,
  getAllocationById,
  getAvailableQuantityController,
  releaseAllocationController,
  commitAllocationController,
  fulfillAllocationController,
} = require("../controllers/allocation.controller");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Create allocation
router.post(
  "/",
  protect,
  authorizeRoles("farmer", "buyer", "fpo", "arthiya"),
  createAllocationController
);

// View allocations
router.get(
  "/",
  protect,
  getAllocations
);

// Available source quantity
router.get(
  "/availability/:sourceType/:sourceId",
  protect,
  getAvailableQuantityController
);

// Get allocation by ID
router.get(
  "/:id",
  protect,
  getAllocationById
);

// Release allocation
router.patch(
  "/:id/release",
  protect,
  releaseAllocationController
);

// Commit allocation
router.patch(
  "/:id/commit",
  protect,
  commitAllocationController
);

// Fulfill allocation
router.patch(
  "/:id/fulfill",
  protect,
  fulfillAllocationController
);

module.exports = router;
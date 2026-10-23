const express = require("express");
const {
  createAllocationController,
  approveAllocationController,
  rejectAllocationController,
  acceptFarmerOfferController,
  getAllocations,
  getAllocationById,
  getAvailableQuantityController,
  releaseAllocationController,
  commitAllocationController,
  fulfillAllocationController,
} = require("../controllers/allocation.controller");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");

const router = express.Router();

// Buyer proposes; the proposal remains non-consuming until supplier approval.
router.post("/", protect, authorizeRoles("buyer"), createAllocationController);
router.get("/", protect, getAllocations);
router.get("/availability/:sourceType/:sourceId", protect, getAvailableQuantityController);
router.get("/:id", protect, getAllocationById);
router.patch("/:id/reject", protect, authorizeRoles("buyer", "farmer", "fpo", "arthiya"), rejectAllocationController);
router.patch("/:id/approve", protect, authorizeRoles("farmer", "fpo", "arthiya", "admin"), approveAllocationController);
router.patch("/:id/accept-offer", protect, authorizeRoles("buyer", "admin"), acceptFarmerOfferController);
router.patch("/:id/release", protect, authorizeRoles("farmer", "fpo", "arthiya", "admin"), releaseAllocationController);
router.patch("/:id/commit", protect, authorizeRoles("buyer", "admin"), commitAllocationController);
router.patch("/:id/fulfill", protect, authorizeRoles("farmer", "fpo", "arthiya", "admin"), fulfillAllocationController);

module.exports = router;

const express = require("express");

const {
  createProcurementRequest,
  getProcurementRequests,
  getProcurementRequestById,
  updateProcurementRequest,
} = require("../controllers/procurementRequest.controller");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Buyer creates demand
router.post(
  "/",
  protect,
  authorizeRoles("buyer"),
  createProcurementRequest
);

// Authenticated users can view demands
router.get(
  "/",
  protect,
  getProcurementRequests
);

router.get(
  "/:id",
  protect,
  getProcurementRequestById
);

// Buyer updates their demand
router.patch(
  "/:id",
  protect,
  authorizeRoles("buyer"),
  updateProcurementRequest
);

module.exports = router;
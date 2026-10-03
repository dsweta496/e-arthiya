const express = require("express");

const {
  createDepositPayment,
  getPaymentById,
  getPayments,
} = require("../controllers/payment.controller");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Buyer completes the 50% security deposit
router.post(
  "/commitments/:commitmentId/deposit",
  protect,
  authorizeRoles("buyer"),
  createDepositPayment
);

// Buyer views their payments
router.get(
  "/",
  protect,
  getPayments
);

// Buyer views a specific payment
router.get(
  "/:id",
  protect,
  getPaymentById
);

module.exports = router;
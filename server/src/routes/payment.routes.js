const express = require("express");
const { createDepositPayment, createBalancePayment, createRefundPayment, getPaymentById, getPayments } = require("../controllers/payment.controller");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");
const router = express.Router();

// Demo-payment flows. These endpoints do not move real money.
router.post("/commitments/:commitmentId/deposit", protect, authorizeRoles("buyer"), createDepositPayment);
router.post("/commitments/:commitmentId/balance", protect, authorizeRoles("buyer"), createBalancePayment);
router.post("/:paymentId/refund", protect, authorizeRoles("admin"), createRefundPayment);
router.get("/", protect, getPayments);
router.get("/:id", protect, getPaymentById);
module.exports = router;

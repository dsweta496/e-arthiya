const express = require("express");
const { protect, authorizeRoles } = require("../middleware/auth.middleware");
const { cancelCommitment, getCommitmentById, getCommitments, approveCommitmentAfterDeposit } = require("../controllers/commitment.controller");
const router = express.Router();
router.get("/", protect, getCommitments);
router.get("/:id", protect, getCommitmentById);
router.post("/:id/withdraw", protect, authorizeRoles("buyer"), cancelCommitment);
router.post("/:id/approve", protect, authorizeRoles("farmer", "admin"), approveCommitmentAfterDeposit);
module.exports = router;

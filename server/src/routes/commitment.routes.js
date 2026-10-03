const express = require("express");

const {
  getCommitmentById,
  cancelCommitment,
  getCommitments,
} = require("../controllers/commitment.controller");

const {
  protect,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Authenticated users can view commitments
router.get(
  "/",
  protect,
  getCommitments
);

router.post(
  "/:id/cancel",
  protect,
  cancelCommitment
);

router.get(
  "/:id",
  protect,
  getCommitmentById
);

module.exports = router;
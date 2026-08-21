const express = require("express");

const {
  getCommitmentById,
  getCommitments,
} = require("../controllers/commitment.controller");

const router = express.Router();

router.get("/", getCommitments);

router.get("/:id", getCommitmentById);

module.exports = router;
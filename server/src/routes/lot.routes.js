const express = require("express");

const {
  createLot,
  getLots,
  getLotById,
  updateLot,
} = require("../controllers/lot.controller");

const router = express.Router();

router.post("/", createLot);

router.get("/", getLots);

router.get("/:id", getLotById);

router.patch("/:id", updateLot);

module.exports = router;
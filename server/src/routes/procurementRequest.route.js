const express = require("express");

const {
  createProcurementRequest,
  getProcurementRequests,
  getProcurementRequestById,
  updateProcurementRequest,
} = require("../controllers/procurementRequest.controller");

const router = express.Router();

router.post("/", createProcurementRequest);

router.get("/", getProcurementRequests);

router.get("/:id", getProcurementRequestById);

router.patch("/:id", updateProcurementRequest);

module.exports = router;
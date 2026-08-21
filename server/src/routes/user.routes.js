const express = require("express");

const {
  createUser,
  getUserById,
  updateUser,
  updateVerificationStatus,
} = require("../controllers/user.controller");

const router = express.Router();

router.post("/", createUser);

router.get("/:id", getUserById);

router.patch("/:id", updateUser);

router.patch(
  "/:id/verification",
  updateVerificationStatus
);

module.exports = router;
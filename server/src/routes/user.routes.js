const express = require("express");

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  updateVerificationStatus,
} = require("../controllers/user.controller");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/", createUser);

router.get("/", protect, getUsers);

router.get("/:id", protect, getUserById);

router.patch("/:id", protect, updateUser);

router.patch(
  "/:id/verification",
  protect,
  authorizeRoles("admin"),
  updateVerificationStatus
);

module.exports = router;

const express = require("express");

const {
  createUser,
  getUserById,
  updateUser,
  updateVerificationStatus,
} = require("../controllers/user.controller");

const {
  protect,
  authorizeRoles,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Keep existing user creation endpoint.
// Public signup should use /api/auth/signup.
router.post(
  "/",
  createUser
);

// Authenticated user lookup
router.get(
  "/:id",
  protect,
  getUserById
);

// Authenticated user update
router.patch(
  "/:id",
  protect,
  updateUser
);

// Verification status should be restricted.
// Admin verification logic will be hardened further later.
router.patch(
  "/:id/verification",
  protect,
  authorizeRoles("admin"),
  updateVerificationStatus
);

module.exports = router;
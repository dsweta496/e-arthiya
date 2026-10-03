const express = require("express");

const {
  signup,
  login,
} = require("../controllers/auth.controller");

const router = express.Router();

// Public authentication routes
router.post("/signup", signup);
router.post("/login", login);

module.exports = router;
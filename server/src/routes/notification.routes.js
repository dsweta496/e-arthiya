const express = require("express");
const { protect } = require("../middleware/auth.middleware");
const { listNotifications, markNotificationRead } = require("../controllers/notification.controller");
const router = express.Router();
router.get("/", protect, listNotifications);
router.patch("/:id/read", protect, markNotificationRead);
module.exports = router;

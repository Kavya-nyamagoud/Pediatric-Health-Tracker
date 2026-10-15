// backend/routes/notificationRoutes.js
const express = require("express");
const { protect } = require("../middleware/authMiddleware"); // ✅ FIXED
const healthController = require("../controllers/healthController");

const router = express.Router();

// All notification endpoints use dummy auth (always passes)
router.use(protect); // ✅ FIXED

// POST /api/notifications/:childId/email
router.post("/:childId/email", healthController.sendEmailReminder);

// POST /api/notifications/:childId/sms
router.post("/:childId/sms", healthController.sendSmsReminder);

module.exports = router;

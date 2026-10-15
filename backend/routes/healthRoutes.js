// backend/routes/healthRoutes.js
const express = require("express");
const healthController = require("../controllers/healthController");
const { protect } = require("../middleware/authMiddleware"); // ⬅️ use named import

const router = express.Router();

// 🔓 For your project/demo: use the dummy protect middleware
// It always sets req.user and calls next(), no JWT check.
router.use(protect);

// ---- AI prediction ----
router.post("/predict/growth", healthController.predictGrowth);

// ---- PDF exports ----
router.get("/export/report/:childId", healthController.exportHealthReportPDF);
router.get("/export/summary/:childId", healthController.exportQuickSummaryPDF);

// ---- EMAIL / SMS REMINDERS (what ChildDetail is calling) ----
router.post("/:childId/notify/email", healthController.sendEmailReminder);
router.post("/:childId/notify/sms", healthController.sendSmsReminder);

// ---- CRUD health records ----
router.post("/", healthController.createHealthRecord);
router.get("/", healthController.getHealthRecords);

router.get("/:recordId", healthController.getHealthRecord);
router.put("/:recordId", healthController.updateHealthRecord);
router.delete("/:recordId", healthController.deleteHealthRecord);

module.exports = router;

console.log("✅ aiRoutes.js LOADED");

const express = require("express");
const router = express.Router();
const { predictGrowth } = require("../services/growthAI");

// -------------------------------------------------
// Test route
// -------------------------------------------------
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "AI route is working 🚀",
  });
});

// -------------------------------------------------
// AI prediction route
// -------------------------------------------------
router.post("/predict", (req, res) => {
  try {
    const { ageMonths, gender, heightCm } = req.body;

    if (!ageMonths || !gender || !heightCm) {
      return res.status(400).json({
        success: false,
        message: "ageMonths, gender, heightCm are required",
      });
    }

    const result = predictGrowth({ ageMonths, gender, heightCm });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("AI prediction error:", err);
    res.status(500).json({
      success: false,
      message: "AI prediction failed",
    });
  }
});

module.exports = router;

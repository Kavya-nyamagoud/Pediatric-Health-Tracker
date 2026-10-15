// backend/services/growthAI.js
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

let dataset = [];

/**
 * Load Kaggle WHO-based dataset into memory
 */
function loadDataset() {
  const filePath = path.join(__dirname, "../data/data_balita.csv");

  if (!fs.existsSync(filePath)) {
    console.error("❌ WHO dataset not found:", filePath);
    return;
  }

  dataset = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      dataset.push({
        ageMonths: Number(row["Umur (bulan)"]),
        gender: row["Jenis Kelamin"],
        height: Number(row["Tinggi Badan (cm)"]),
        nutrition: row["Status Gizi"]
      });
    })
    .on("end", () => {
      console.log(`✅ WHO dataset loaded (${dataset.length} records)`);
    });
}

/**
 * Predict nutrition status using nearest match
 */
function predictNutrition(ageMonths, gender, height) {
  if (!dataset.length) {
    return { status: "unknown", confidence: 0 };
  }

  // Filter by age ±1 month and same gender
  const candidates = dataset.filter(d =>
    Math.abs(d.ageMonths - ageMonths) <= 1 &&
    d.gender.toLowerCase() === gender.toLowerCase()
  );

  if (!candidates.length) {
    return { status: "normal", confidence: 0.4 };
  }

  // Find closest height match
  let closest = candidates[0];
  let minDiff = Math.abs(closest.height - height);

  for (const c of candidates) {
    const diff = Math.abs(c.height - height);
    if (diff < minDiff) {
      minDiff = diff;
      closest = c;
    }
  }

  return {
    status: closest.nutrition,
    confidence: 0.8
  };
}

/**
 * Generate vaccination + health recommendation
 */
function generateRecommendation(ageMonths, nutritionStatus) {
  let recommendation = [];

  if (ageMonths <= 12) {
    recommendation.push("Follow primary immunization schedule strictly");
  } else if (ageMonths <= 24) {
    recommendation.push("Ensure booster vaccines are completed");
  } else {
    recommendation.push("Continue routine immunization checks");
  }

  if (nutritionStatus.includes("stunted")) {
    recommendation.push("High-priority vaccination");
    recommendation.push("Nutritional intervention recommended");
  }

  return recommendation;
}

/**
 * -------------------------------
 * ✅ ADDED: Explicit Risk Mapping
 * -------------------------------
 */
function determineRiskLevel(nutritionStatus) {
  const status = nutritionStatus.toLowerCase();

  if (status.includes("severely") || status.includes("very thin")) {
    return "High Risk";
  }

  if (status.includes("stunted") || status.includes("thin")) {
    return "Moderate Risk";
  }

  return "Low Risk";
}

/**
 * -------------------------------
 * ✅ ADDED: Unified AI Output
 * -------------------------------
 */
function runGrowthAI(ageMonths, gender, height) {
  const nutritionResult = predictNutrition(ageMonths, gender, height);
  const recommendations = generateRecommendation(ageMonths, nutritionResult.status);
  const riskLevel = determineRiskLevel(nutritionResult.status);

  return {
    ageMonths,
    gender,
    heightCm: height,
    nutritionStatus: nutritionResult.status,
    confidence: nutritionResult.confidence,
    riskLevel,                 // 🔥 EXPLICIT RISK
    recommendations
  };
}

module.exports = {
  loadDataset,
  predictNutrition,
  generateRecommendation,
  determineRiskLevel,   // ✅ exported
  runGrowthAI           // ✅ main AI output
};

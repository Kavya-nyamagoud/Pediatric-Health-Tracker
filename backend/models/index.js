// backend/models/index.js
const { loadDataset } = require('../services/growthAI');
const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const sequelize = require("../sequelize");

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

/* ============================
   ✅ AI DATASET LOADING (ADDED)
   ============================ */
try {
  const datasetPath = path.join(__dirname, "../data/data_balita.csv");
  if (fs.existsSync(datasetPath)) {
    loadDataset(datasetPath);
    console.log("✅ Growth AI dataset loaded successfully");
  } else {
    console.warn("⚠️ Growth AI dataset not found at:", datasetPath);
  }
} catch (err) {
  console.error("❌ Failed to load Growth AI dataset:", err.message || err);
}
/* ============================ */

// load every .js file in models folder except index.js
fs.readdirSync(__dirname)
  .filter((file) => file !== "index.js" && file.endsWith(".js"))
  .forEach((file) => {
    try {
      const model = require(path.join(__dirname, file));
      // if model exports a function that defines the model, call it
      if (typeof model === "function" && model.name === "model") {
        // rare pattern - ignore
      } else if (model && model.name) {
        db[model.name] = model;
      } else if (model && typeof model === "function") {
        // some projects export as function(sequelize, DataTypes) => define
        const defined = model(sequelize, Sequelize.DataTypes);
        if (defined && defined.name) db[defined.name] = defined;
      }
    } catch (err) {
      console.error("Failed to load model file:", file, err.message || err);
    }
  });

// call .associate if any model defines it
Object.keys(db).forEach((modelName) => {
  if (db[modelName] && typeof db[modelName].associate === "function") {
    db[modelName].associate(db);
  }
});

// Ensure basic associations exist for core models
if (db.Child && db.HealthRecord) {
  db.Child.hasMany(db.HealthRecord, { foreignKey: 'childId' });
  db.HealthRecord.belongsTo(db.Child, { foreignKey: 'childId' });
}
loadDataset();
module.exports = db;

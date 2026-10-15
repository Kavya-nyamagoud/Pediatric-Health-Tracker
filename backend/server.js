console.log("🚀 Starting server...");

require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ 
  limit: '10mb', 
  extended: true,
  parameterLimit: 50000
}));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// -------------------------------------------------
// Load DB (sequelize)
// -------------------------------------------------
let db;
let sequelize;

try {
  db = require("./models");
  sequelize = db.sequelize;
} catch (err) {
  console.error("❌ Could not load Sequelize models:", err.message);
}

if (sequelize) {
  sequelize
    .authenticate()
    .then(() => console.log("✅ PostgreSQL Connected"))
    .catch((err) => console.error("❌ PostgreSQL Error:", err));

  sequelize
    .sync({ alter: true })
    .then(() => console.log("✅ All tables synced successfully"))
    .catch((err) => console.error("❌ Sync error:", err));
}

// -------------------------------------------------
// Load Routes (AFTER app is created)
// -------------------------------------------------
const authRoutes = require("./routes/authRoutes");
const childRoutes = require("./routes/childRoutes");
const healthRoutes = require("./routes/healthRoutes");
const alertsRoutes = require("./routes/alertsRoutes");
const aiRoutes = require("./routes/aiRoutes");

// -------------------------------------------------
// Mount Routes
// -------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/children", childRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/ai", aiRoutes);

// -------------------------------------------------
// Debug route list
// -------------------------------------------------
app.get("/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((layer) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(",").toUpperCase();
      routes.push(`${methods} ${layer.route.path}`);
    }
  });
  res.json(routes);
});

// -------------------------------------------------
// Root
// -------------------------------------------------
app.get("/", (req, res) => {
  res.send("Pediatric Health Tracker Backend Running ✅");
});

// -------------------------------------------------
// API catch-all
// -------------------------------------------------
app.use("/api", (req, res) => {
  return res.status(404).json({
    success: false,
    message: `No API route for ${req.method} ${req.originalUrl}`,
  });
});

// -------------------------------------------------
// Start server
// -------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

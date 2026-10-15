// backend/routes/childRoutes.js
const express = require("express");
const router = express.Router();
const childController = require("../controllers/childController");
const { protect } = require("../middleware/authMiddleware");

// All child routes require authentication
router.use(protect);

router.get("/", childController.getAllChildren);
router.post("/", childController.createChild);
router.get("/:childId", childController.getChild);

// Vaccination status for a child (uses built-in schedule service)
router.get("/:childId/vaccination-status", childController.getVaccinationStatus);

// Doctor suggestions: get list and create new suggestion (doctors only to create)
router.get("/:childId/suggestions", childController.getSuggestions);
router.post("/:childId/suggestions", childController.createSuggestion);

// Parent marks a suggestion as completed (records completion + notifies the doctor)
router.post("/:childId/suggestions/:suggestionId/complete", childController.completeSuggestion);

router.put("/:childId", childController.updateChild);
router.delete("/:childId", childController.deleteChild);

module.exports = router;

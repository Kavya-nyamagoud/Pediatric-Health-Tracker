const { Child, HealthRecord, User, Vaccination, Vaccine } = require("../models");
const { Op } = require("sequelize");
const NotificationService = require("../services/notificationService");

/**
 * Helper: verify that user can access this child
 * - parent: only own children
 * - doctor: can access any child
 */
async function findAccessibleChild(childId, user) {
  const where = { id: childId };

  if (user.role === "parent") {
    where.userId = user.id;
  }
  // if doctor → no userId condition (can see all)

  const child = await Child.findOne({ where });
  return child;
}

// Create health record
// Parents can only create for their own children
// Doctors can create for any child
exports.createHealthRecord = async (req, res) => {
  try {
    // Log request details for debugging
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    console.log('Raw body:', req.body);
    
    // Handle both JSON and form-data
    let body = req.body;
    
    // If body is a string, try to parse it as JSON
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.log('Body is not JSON, using as-is');
      }
    }
    
    // If we still don't have an object, use an empty object
    if (typeof body !== 'object' || body === null) {
      console.log('No valid JSON body, trying to use raw body');
      body = req.body || {};
    }
    const {
      childId,
      type,
      height,
      weight,
      headCircumference,
      bmi,
      vaccination,
      dateAdministered,
      notes
    } = req.body;

    if (!childId) {
      return res
        .status(400)
        .json({ msg: "childId is required", code: "VALIDATION_ERROR" });
    }

    // Check access
    const child = await findAccessibleChild(childId, req.user);
    if (!child) {
      return res
        .status(403)
        .json({ msg: "Child not found or access denied", code: "FORBIDDEN" });
    }

    // Validate type
    const validTypes = ["growth", "vaccination", "visit", "med"];
    if (type && !validTypes.includes(type)) {
      return res
        .status(400)
        .json({ msg: "Invalid record type", code: "VALIDATION_ERROR" });
    }

    const record = await HealthRecord.create({
      childId,
      type: type || "visit",
      height: height || null,
      weight: weight || null,
      headCircumference: headCircumference || null,
      bmi: bmi || null,
      vaccination: vaccination || null,
      dateAdministered: dateAdministered || new Date(),
      notes: notes || null,
      recordedBy: req.user.id
    });

    res.status(201).json(record);
  } catch (error) {
    console.error("Error creating health record:", {
      error: error.message,
      stack: error.stack,
      childId: req.body.childId,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false, 
      error: "Failed to create health record",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get health records for a child
// parent → only own child
// doctor → can view any
exports.getHealthRecords = async (req, res) => {
  try {
    const { childId, type, startDate, endDate, limit = 50, offset = 0 } =
      req.query;

    if (!childId) {
      return res.status(400).json({
        msg: "childId query parameter is required",
        code: "VALIDATION_ERROR"
      });
    }

    const child = await findAccessibleChild(childId, req.user);
    if (!child) {
      return res
        .status(403)
        .json({ msg: "Child not found or access denied", code: "FORBIDDEN" });
    }

    const where = { childId };
    if (type) where.type = type;

    if (startDate || endDate) {
      where.dateAdministered = {};
      if (startDate) where.dateAdministered[Op.gte] = new Date(startDate);
      if (endDate) where.dateAdministered[Op.lte] = new Date(endDate);
    }

    const recLimit = Math.min(parseInt(limit), 200);
    const recOffset = parseInt(offset);

    const records = await HealthRecord.findAll({
      where,
      limit: recLimit,
      offset: recOffset,
      order: [["createdAt", "DESC"]]
    });

    const total = await HealthRecord.count({ where });

    console.info(`[healthController] getHealthRecords - user=${req.user.id} role=${req.user.role} childId=${childId} records=${records.length}`)

    res.json({
      records,
      total,
      limit: recLimit,
      offset: recOffset
    });
  } catch (error) {
    console.error("Error getting health records:", {
      error: error.message,
      stack: error.stack,
      childId: req.query.childId,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false, 
      error: "Failed to get health records",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single health record
exports.getHealthRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await HealthRecord.findByPk(recordId);

    if (!record) {
      return res
        .status(404)
        .json({ msg: "Health record not found", code: "NOT_FOUND" });
    }

    // Access check: fetch child separately to avoid association-dependent includes
    const child = await findAccessibleChild(record.childId, req.user);
    if (!child) {
      return res.status(403).json({ msg: "Access denied", code: "FORBIDDEN" });
    }

    res.json(record);
  } catch (error) {
    console.error("Error getting health record:", {
      error: error.message,
      stack: error.stack,
      recordId: req.params.recordId,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false, 
      error: "Failed to get health record",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update health record
exports.updateHealthRecord = async (req, res) => {
  try {
    const { recordId } = req.params;
    const {
      type,
      height,
      weight,
      headCircumference,
      bmi,
      vaccination,
      dateAdministered,
      notes
    } = req.body;

    const record = await HealthRecord.findByPk(recordId, {
      include: [{ model: Child, attributes: ["userId"] }]
    });

    if (!record) {
      return res
        .status(404)
        .json({ msg: "Health record not found", code: "NOT_FOUND" });
    }

    // Access check
    if (req.user.role === "parent" && record.Child.userId !== req.user.id) {
      return res.status(403).json({ msg: "Access denied", code: "FORBIDDEN" });
    }
    // doctor → allowed

    if (type) {
      const validTypes = ["growth", "vaccination", "visit", "med"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          msg: "Invalid record type",
          code: "VALIDATION_ERROR"
        });
      }
      record.type = type;
    }
    if (height !== undefined) record.height = height;
    if (weight !== undefined) record.weight = weight;
    if (headCircumference !== undefined)
      record.headCircumference = headCircumference;
    if (bmi !== undefined) record.bmi = bmi;
    if (vaccination !== undefined) record.vaccination = vaccination;
    if (dateAdministered !== undefined) record.dateAdministered = dateAdministered;
    if (notes !== undefined) record.notes = notes;

    await record.save();

    res.json(record);
  } catch (error) {
    console.error("Error updating health record:", {
      error: error.message,
      stack: error.stack,
      recordId: req.params.recordId,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false, 
      error: "Failed to update health record",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete health record
exports.deleteHealthRecord = async (req, res) => {
  try {
    const { recordId } = req.params;

    const record = await HealthRecord.findByPk(recordId, {
      include: [{ model: Child, attributes: ["userId"] }]
    });

    if (!record) {
      return res
        .status(404)
        .json({ msg: "Health record not found", code: "NOT_FOUND" });
    }

    // Access check
    if (req.user.role === "parent" && record.Child.userId !== req.user.id) {
      return res.status(403).json({ msg: "Access denied", code: "FORBIDDEN" });
    }
    // doctor → allowed

    await record.destroy();

    res.json({ msg: "Health record deleted successfully" });
  } catch (error) {
    console.error("Error deleting health record:", {
      error: error.message,
      stack: error.stack,
      recordId: req.params.recordId,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false, 
      error: "Failed to delete health record",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// AI Growth Prediction
exports.predictGrowth = async (req, res) => {
  try {
    const { childId } = req.body;

    if (!childId) {
      return res
        .status(400)
        .json({ msg: "childId is required", code: "VALIDATION_ERROR" });
    }

    const child = await findAccessibleChild(childId, req.user);
    if (!child) {
      return res
        .status(403)
        .json({ msg: "Child not found or access denied", code: "FORBIDDEN" });
    }

    const records = await HealthRecord.findAll({
      where: { childId, type: "growth" },
      order: [["createdAt", "ASC"]],
      limit: 100
    });

    const GrowthPredictionModel = require("../models/growthPredictionModel");
    const prediction = GrowthPredictionModel.predictGrowth(records);

    res.json({
      childId,
      childName: `${child.firstName} ${child.lastName}`,
      dateOfBirth: child.dateOfBirth,
      ...prediction
    });
  } catch (error) {
    console.error("Error predicting growth:", {
      error: error.message,
      stack: error.stack,
      childId: req.body.childId,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    res.status(500).json({ 
      success: false, 
      error: "Failed to predict growth",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export detailed health report PDF
exports.exportHealthReportPDF = async (req, res) => {
  try {
    console.log('=== EXPORT HEALTH REPORT DEBUG ===');
    console.log('req.params:', JSON.stringify(req.params, null, 2));
    console.log('req.query:', JSON.stringify(req.query, null, 2));
    
    // Extract childId with multiple fallbacks
    const childId = req.params.childId || req.params.id || req.query.childId || req.query.id;
    
    console.log('Extracted childId:', childId);
    console.log('==================================');

    if (!childId) {
      return res.status(400).json({ 
        msg: "Child ID is required", 
        code: "VALIDATION_ERROR",
        debug: {
          params: req.params,
          query: req.query
        }
      });
    }

    const child = await findAccessibleChild(childId, req.user);
    if (!child) {
      return res
        .status(403)
        .json({ msg: "Child not found or access denied", code: "FORBIDDEN" });
    }

    const records = await HealthRecord.findAll({
      where: { childId: childId },
      order: [["dateAdministered", "DESC"]]
    });

    const PDFExportService = require("../services/pdfExportService");
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="health-report-${child.firstName}-${child.lastName}-${Date.now()}.pdf"`
    );

    // Get vaccination status if includeVaccination is true
    let vaccineStatus = null;
    if (req.query.includeVaccination !== 'false') {
      try {
        const vaccineService = new (require('../services/vaccinationScheduleService'))();
        const administeredVaccines = await Vaccination.findAll({
          where: { childId: childId },
          include: [Vaccine]
        });
        
        const status = await vaccineService.checkVaccinationStatus(
          child.dateOfBirth,
          administeredVaccines
        ) || {};
        
        const reminders = await vaccineService.generateReminders(
          child.dateOfBirth,
          administeredVaccines
        ) || [];
        
        const recommended = await vaccineService.getRecommendedVaccines(
          child.dateOfBirth,
          administeredVaccines
        ) || [];
        
        vaccineStatus = {
          status: {
            dueVaccines: status.dueVaccines || [],
            overdueVaccines: status.overdueVaccines || [],
            completedVaccines: status.completedVaccines || [],
            upcomingVaccines: status.upcomingVaccines || []
          },
          reminders: Array.isArray(reminders) ? reminders : [],
          recommended: Array.isArray(recommended) ? recommended : []
        };
      } catch (vaccineError) {
        console.error('Error getting vaccination status for health report:', {
          error: vaccineError.message,
          childId: childId
        });
      }
    }

    // Get prediction if requested
    let prediction = null;
    if (req.query.includeGrowthPrediction === 'true') {
      try {
        const growthRecords = records.filter(r => r.type === "growth");
        if (growthRecords.length >= 2) {
          const GrowthPredictionModel = require("../models/growthPredictionModel");
          prediction = GrowthPredictionModel.predictGrowth(growthRecords);
        }
      } catch (predictionError) {
        console.error('Error generating growth prediction:', {
          error: predictionError.message,
          childId: childId
        });
      }
    }

    const doc = PDFExportService.generateHealthReport(
      child,
      records,
      prediction,
      vaccineStatus
    );

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error("Export health report PDF error:", {
      message: error.message,
      stack: error.stack,
      params: req.params,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({
      msg: "Failed to generate health report PDF",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: "PDF_GENERATION_ERROR",
      debug: process.env.NODE_ENV === 'development' ? {
        params: req.params,
        query: req.query,
        stack: error.stack
      } : undefined
    });
  }
};

// Export quick summary PDF (single page)
exports.exportQuickSummaryPDF = async (req, res) => {
  // Define all variables at the top to ensure they're in scope for error handling
  let childId;
  let child;
  let records = [];
  let prediction = null;
  let vaccinationStatus = {
    status: {
      dueVaccines: [],
      overdueVaccines: [],
      completedVaccines: [],
      upcomingVaccines: []
    },
    reminders: [],
    recommended: []
  };

  try {
    // Log request details for debugging
    console.log('=== EXPORT QUICK SUMMARY DEBUG ===');
    console.log('req.params:', JSON.stringify(req.params, null, 2));
    console.log('req.query:', JSON.stringify(req.query, null, 2));
    
    // Extract childId with multiple fallbacks
    childId = req.params.childId || req.params.id || req.query.childId || req.query.id;
    
    console.log('Extracted childId:', childId);
    console.log('=================================');
    
    // Validate childId
    if (!childId) {
      console.error('Missing childId in request');
      return res.status(400).json({ 
        success: false,
        msg: "Child ID is required", 
        code: "VALIDATION_ERROR",
        debug: process.env.NODE_ENV === 'development' ? {
          params: req.params,
          query: req.query,
          path: req.path,
          url: req.url
        } : undefined
      });
    }

    // Validate user
    if (!req || !req.user || !req.user.id) {
      console.error('Authentication required');
      return res.status(401).json({
        success: false,
        msg: "Authentication required",
        code: "UNAUTHORIZED"
      });
    }

    // Get child data
    console.log(`Fetching child with ID: ${childId} for user: ${req.user.id}`);
    child = await findAccessibleChild(childId, req.user);
    if (!child) {
      console.error(`Child not found or access denied. Child ID: ${childId}, User ID: ${req.user.id}`);
      return res.status(403).json({ 
        success: false,
        msg: "Child not found or access denied", 
        code: "FORBIDDEN" 
      });
    }
    
    console.log(`Found child: ${child.firstName} ${child.lastName}`);

    // Get health records
    console.log(`Fetching health records for child: ${childId}`);
    records = await HealthRecord.findAll({
      where: { childId },
      order: [["createdAt", "DESC"]],
      limit: 20
    });
    console.log(`Found ${records.length} health records`);

    // Get growth prediction if enough records
    console.log('Checking for growth records...');
    const growthRecords = records.filter(r => r && r.type === "growth");
    if (growthRecords.length >= 2) {
      console.log(`Found ${growthRecords.length} growth records, generating prediction...`);
      try {
        const GrowthPredictionModel = require("../models/growthPredictionModel");
        prediction = GrowthPredictionModel.predictGrowth(growthRecords);
        console.log('Growth prediction generated successfully');
      } catch (predictionError) {
        console.error('Error generating growth prediction:', {
          error: predictionError.message,
          childId,
          recordsCount: growthRecords.length,
          stack: process.env.NODE_ENV === 'development' ? predictionError.stack : undefined
        });
      }
    } else {
      console.log(`Insufficient growth records (${growthRecords.length} found, need at least 2)`);
    }

    // Get vaccination status
    console.log('Fetching vaccination status...');

    try {
      const vaccineService = new (require('../services/vaccinationScheduleService'))();
      const administeredVaccines = await Vaccination.findAll({
        where: { childId: childId },
        include: [Vaccine]
      });

      const status = await vaccineService.checkVaccinationStatus(
        child.dateOfBirth,
        administeredVaccines
      ) || {};

      const reminders = await vaccineService.generateReminders(
        child.dateOfBirth,
        administeredVaccines
      ) || [];

      const recommended = await vaccineService.getRecommendedVaccines(
        child.dateOfBirth,
        administeredVaccines
      ) || [];

      vaccinationStatus = {
        status: {
          dueVaccines: status.dueVaccines || [],
          overdueVaccines: status.overdueVaccines || [],
          completedVaccines: status.completedVaccines || [],
          upcomingVaccines: status.upcomingVaccines || []
        },
        reminders: Array.isArray(reminders) ? reminders : [],
        recommended: Array.isArray(recommended) ? recommended : []
      };
    } catch (vaccineError) {
      console.error('Error getting vaccination status:', {
        error: vaccineError.message,
        childId: childId,
        childDOB: child.dateOfBirth
      });
    }

    // Generate PDF
    const PDFExportService = require("../services/pdfExportService");
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="summary-${child.firstName}-${child.lastName}-${Date.now()}.pdf"`
    );

    const doc = PDFExportService.generateQuickSummary(
      child,
      records,
      prediction,
      vaccinationStatus
    );

    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('PDF Generation Error:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
      query: req.query,
      path: req.path,
      timestamp: new Date().toISOString()
    });
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        msg: 'Failed to generate PDF report',
        code: 'PDF_GENERATION_ERROR',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        debug: process.env.NODE_ENV === 'development' ? {
          params: req.params,
          query: req.query,
          stack: error.stack
        } : undefined
      });
    }
  }
};

/*         EMAIL + SMS REMINDER ENDPOINTS (for notifications)         */
/* ------------------------------------------------------------------ */

// POST /api/health/:childId/notify/email
exports.sendEmailReminder = async (req, res) => {
  try {
    const { childId } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        msg: "subject and message are required",
        code: "VALIDATION_ERROR"
      });
    }

    const child = await findAccessibleChild(childId, req.user);
    if (!child) {
      return res
        .status(403)
        .json({ msg: "Child not found or access denied", code: "FORBIDDEN" });
    }

    const parent = await User.findByPk(child.userId);
    if (!parent || !parent.email) {
      return res.status(400).json({
        msg: "Parent email not found for this child",
        code: "NO_PARENT_EMAIL"
      });
    }

    await NotificationService.sendEmail({
      to: parent.email,
      subject,
      text: message
    });

    return res.json({ msg: "Email reminder sent successfully" });
  } catch (err) {
    console.error("sendEmailReminder error:", err);
    res
      .status(500)
      .json({ msg: "Server error", error: err.message, code: "SERVER_ERROR" });
  }
};

// POST /api/health/:childId/notify/sms
exports.sendSmsReminder = async (req, res) => {
  try {
    const { childId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ msg: "message is required", code: "VALIDATION_ERROR" });
    }

    const child = await findAccessibleChild(childId, req.user);
    if (!child) {
      return res
        .status(403)
        .json({ msg: "Child not found or access denied", code: "FORBIDDEN" });
    }

    const parent = await User.findByPk(child.userId);
    if (!parent || !parent.phone) {
      return res.status(400).json({
        msg: "Parent phone number not found for this child",
        code: "NO_PARENT_PHONE"
      });
    }

    await NotificationService.sendSMS({
      to: parent.phone,
      body: message
    });

    return res.json({ msg: "SMS reminder sent successfully" });
  } catch (err) {
    console.error("sendSmsReminder error:", err);
    res
      .status(500)
      .json({ msg: "Server error", error: err.message, code: "SERVER_ERROR" });
  }
};
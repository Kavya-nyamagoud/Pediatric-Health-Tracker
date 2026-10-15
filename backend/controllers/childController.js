// backend/controllers/childController.js
const { Op } = require("sequelize");
const Child = require("../models/Child"); // ensure file exists: backend/models/Child.js

exports.getAllChildren = async (req, res) => {
  try {
    // if protect middleware set req.user, use it; if not present, respond 401
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authorized to view children" });
    }

    // parents see their children; doctors/admins can see all by default
    // Added: doctors can request only their assigned patients by passing ?assigned=true
    const where = {}

    if (req.user.role === 'parent') {
      where.userId = req.user.id
    } else if (req.user.role === 'doctor' && req.query && req.query.assigned === 'true') {
      // return only children assigned to this doctor (i.e., children with suggestions by this doctor)
      const DoctorSuggestion = require('../models/DoctorSuggestion')
      const suggs = await DoctorSuggestion.findAll({ where: { doctorId: req.user.id }, attributes: ['childId'], group: ['childId'] })
      const childIds = suggs.map(s => s.childId).filter(Boolean)
      console.info(`[childController] getAllChildren - doctor=${req.user.id} assigned suggestions count=${suggs.length} childIds=${JSON.stringify(childIds)}`)
      if (childIds.length === 0) {
        console.info(`[childController] getAllChildren - doctor=${req.user.id} assigned=true found=0`)
        return res.json([])
      }
      where.id = childIds
    }

    const children = await Child.findAll({ where })
    console.info(`[childController] getAllChildren - user=${req.user.id} role=${req.user.role} where=${JSON.stringify(where)} found=${children.length}`)
    return res.json(children);
  } catch (err) {
    console.error("childController.getAllChildren error:", err);
    return res.status(500).json({ success: false, message: "Server error loading children" });
  }
};

exports.createChild = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });

    // Accept firstName/lastName/dateOfBirth payload from frontend
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      bloodType,
      allergies,
      medications,
      notes,
    } = req.body || {}

    if (!firstName && !lastName) {
      return res.status(400).json({ success: false, message: "Child first name or last name required" });
    }

    // Only parents may create children
    if (req.user.role !== 'parent') {
      return res.status(403).json({ success: false, message: 'Only parents may add children' })
    }

    console.info('[childController] creating child', { userId: req.user && req.user.id, body: req.body })
    const payload = {
      firstName: firstName || null,
      lastName: lastName || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      bloodType: bloodType || null,
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : null),
      medications: Array.isArray(medications) ? medications : (medications ? [medications] : null),
      notes: notes || null,
      userId: req.user.id,
    }
    console.info('[childController] child payload', payload)
    const child = await Child.create(payload)

    // return created child object directly for frontend convenience
    return res.status(201).json(child);
  } catch (err) {
    console.error("childController.createChild error:", err);
    // Return error message for debugging (safe locally)
    return res.status(500).json({ success: false, message: "Server error creating child", error: err.message || String(err) });
  }
};

exports.getChild = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });

    const where = { id: req.params.childId }
    if (req.user.role === 'parent') where.userId = req.user.id

    const child = await Child.findOne({ where })
    if (!child) return res.status(404).json({ success: false, message: "Child not found" })

    // return raw child object to match frontend expectations
    return res.json(child)
  } catch (err) {
    console.error("childController.getChild error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * GET /children/:childId/vaccination-status
 * Returns vaccination reminders, recommended schedule and a status summary for the child
 */
exports.getVaccinationStatus = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });

    const childId = parseInt(req.params.childId, 10)
    if (isNaN(childId)) return res.status(400).json({ success: false, message: 'Invalid childId' })

    // Parents may only view suggestions for their own child
    let child = null
    if (req.user.role === 'parent') {
      child = await Child.findOne({ where: { id: childId, userId: req.user.id } })
      if (!child) return res.status(404).json({ success: false, message: 'Child not found' })
    } else {
      child = await Child.findOne({ where: { id: childId } })
      if (!child) return res.status(404).json({ success: false, message: 'Child not found' })
    }

    const HealthRecord = require('../models/HealthRecord')
    const records = await HealthRecord.findAll({ where: { childId } })

    const administeredVaccines = records
      .filter(r => r && (r.type === 'vaccination' || r.type === 'vaccine' || r.vaccination || r.vaccine || r.vaccineName))
      .map(r => (r.vaccination || r.vaccine || r.vaccineName || r.name || '').trim())

    const VaccinationScheduleService = require('../services/vaccinationScheduleService')
    console.info('[getVaccinationStatus] administeredVaccines:', administeredVaccines)
    const status = await VaccinationScheduleService.checkVaccinationStatus(child.dateOfBirth, administeredVaccines)
    console.info('[getVaccinationStatus] raw status from service:', status)
    const reminders = await VaccinationScheduleService.generateReminders(child.dateOfBirth, administeredVaccines)

    // Reuse the enriched recommended schedule produced by the service (ensures consistency)
    let recommended = status.recommendedSchedule || await VaccinationScheduleService.getRecommendedVaccines(child.dateOfBirth, administeredVaccines)
    console.info('[getVaccinationStatus] recommended (service-provided) sample:', recommended && recommended.slice(-3))

    // Ensure vaccinationStatus is a plain object with arrays (avoid serialization surprises)
    const safeStatus = {
      totalRecommended: status.totalRecommended || 0,
      dueVaccines: status.dueVaccines || [],
      overdueVaccines: status.overdueVaccines || [],
      upcomingVaccines: status.upcomingVaccines || [],
      completedVaccines: status.completedVaccines || [],
      overallStatus: status.overallStatus || 'unknown'
    }

    return res.json({
      childId,
      reminders,
      recommendedSchedule: recommended,
      vaccinationStatus: safeStatus
    })
  } catch (err) {
    console.error('childController.getVaccinationStatus error:', err)
    return res.status(500).json({ success: false, message: 'Server error fetching vaccination status' })
  }
};

exports.updateChild = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });

    const child = await Child.findOne({ where: { id: req.params.childId, userId: req.user.id } });
    if (!child) return res.status(404).json({ success: false, message: "Child not found" });

    await child.update(req.body);
    return res.json({ success: true, data: child });
  } catch (err) {
    console.error("childController.updateChild error:", err);
    return res.status(500).json({ success: false, message: "Server error updating child" });
  }
};

exports.deleteChild = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });

    const child = await Child.findOne({ where: { id: req.params.childId, userId: req.user.id } });
    if (!child) return res.status(404).json({ success: false, message: "Child not found" });

    await child.destroy();
    return res.json({ success: true, message: "Child deleted" });
  } catch (err) {
    console.error("childController.deleteChild error:", err);
    return res.status(500).json({ success: false, message: "Server error deleting child" });
  }
};

// -----------------------------
// Doctor suggestions endpoints
// -----------------------------
const DoctorSuggestion = require('../models/DoctorSuggestion');
const SuggestionCompletion = require('../models/SuggestionCompletion');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

exports.getSuggestions = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: "Not authorized" });

    const childId = parseInt(req.params.childId, 10);
    if (isNaN(childId)) return res.status(400).json({ success: false, message: 'Invalid childId' });

    // Parents may only view suggestions for their own child
    if (req.user.role === 'parent') {
      const child = await Child.findOne({ where: { id: childId, userId: req.user.id } });
      if (!child) return res.status(404).json({ success: false, message: 'Child not found' });
    }

    const suggestions = await DoctorSuggestion.findAll({ where: { childId }, order: [['createdAt', 'DESC']] });

    // Attach latest completion info to each suggestion so doctors can see when parents mark them completed
    const suggestionsWithCompletion = await Promise.all(suggestions.map(async (s) => {
      const latestCompletion = await SuggestionCompletion.findOne({ where: { suggestionId: s.id }, order: [['createdAt', 'DESC']] });
      return { ...s.toJSON(), latestCompletion: latestCompletion ? latestCompletion.toJSON() : null, completed: !!latestCompletion };
    }));

    return res.json(suggestionsWithCompletion);
  } catch (err) {
    console.error('childController.getSuggestions error:', err);
    return res.status(500).json({ success: false, message: 'Server error fetching suggestions' });
  }
};

exports.createSuggestion = async (req, res) => {
  try {
    console.info('[childController] createSuggestion called', { method: req.method, url: req.originalUrl, user: req.user && req.user.id, body: req.body });

    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });

    // Only doctors can create suggestions
    if (req.user.role !== 'doctor') return res.status(403).json({ success: false, message: 'Only doctors may add suggestions' });

    const childId = parseInt(req.params.childId, 10);
    if (isNaN(childId)) return res.status(400).json({ success: false, message: 'Invalid childId' });

    const { suggestion } = req.body || {};
    if (!suggestion || suggestion.trim().length === 0) return res.status(400).json({ success: false, message: 'Suggestion text required' });

    const child = await Child.findOne({ where: { id: childId } });
    if (!child) return res.status(404).json({ success: false, message: 'Child not found' });

    const s = await DoctorSuggestion.create({ childId, doctorId: req.user.id, suggestion: suggestion.trim() });
    console.info('[childController] suggestion created', { id: s.id, childId: s.childId, doctorId: s.doctorId });
    return res.status(201).json(s);
  } catch (err) {
    console.error('childController.createSuggestion error:', err);
    return res.status(500).json({ success: false, message: 'Server error creating suggestion' });
  }
};

/**
 * Parent marks a doctor's suggestion as completed. Sends notification to the doctor and records completion.
 */
exports.completeSuggestion = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Not authorized' });

    const childId = parseInt(req.params.childId, 10);
    const suggestionId = parseInt(req.params.suggestionId, 10);

    if (isNaN(childId) || isNaN(suggestionId)) return res.status(400).json({ success: false, message: 'Invalid ids' });

    // Only parent of the child can mark as completed (doctors/admins might use other flows)
    if (req.user.role === 'parent') {
      const child = await Child.findOne({ where: { id: childId, userId: req.user.id } });
      if (!child) return res.status(404).json({ success: false, message: 'Child not found' });
    }

    const suggestion = await DoctorSuggestion.findOne({ where: { id: suggestionId, childId } });
    if (!suggestion) return res.status(404).json({ success: false, message: 'Suggestion not found' });

    const { note } = req.body || {}

    // Record completion
    // Ensure table exists (sync) before create to avoid first-time missing table errors
    try {
      await SuggestionCompletion.sync({ alter: true })
    } catch (syncErr) {
      console.warn('SuggestionCompletion.sync failed', syncErr?.message || syncErr)
    }

    let completion
    try {
      completion = await SuggestionCompletion.create({ suggestionId, parentId: req.user.id, note: note || null })
    } catch (createErr) {
      console.error('Failed to create SuggestionCompletion:', createErr?.message || createErr)
      return res.status(500).json({ success: false, message: 'Failed to record suggestion completion', error: (createErr?.message || createErr) })
    }

    // Notify doctor by email (if configured)
    try {
      const doctor = await User.findByPk(suggestion.doctorId);
      if (doctor && doctor.email) {
        const subject = `Suggestion completed for ${childId} by parent`;
        const text = `The parent (id=${req.user.id}) has marked the suggestion as completed.\n\nSuggestion: ${suggestion.suggestion}\n\nNote from parent: ${note || '—'}`;
        await NotificationService.sendEmail({ to: doctor.email, subject, text });
      } else {
        console.debug('No doctor email to notify or doctor not found');
      }
    } catch (e) {
      console.error('Failed to notify doctor', e?.message || e)
    }

    console.info('[childController] suggestion completed', { suggestionId, parentId: req.user.id, completionId: completion.id })

    // Return updated suggestion with latest completion info so clients can refresh UI
    const latestCompletion = await SuggestionCompletion.findOne({ where: { suggestionId }, order: [['createdAt', 'DESC']] })
    const updatedSuggestion = { ...(suggestion.toJSON ? suggestion.toJSON() : suggestion), latestCompletion: latestCompletion ? latestCompletion.toJSON() : null, completed: !!latestCompletion }

    return res.json({ success: true, message: 'Suggestion marked completed', completion, updatedSuggestion });
  } catch (err) {
    console.error('childController.completeSuggestion error:', err);
    return res.status(500).json({ success: false, message: 'Server error completing suggestion' });
  }
};

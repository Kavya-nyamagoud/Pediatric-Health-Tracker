const express = require('express');
const router = express.Router();
const db = require('../models');
const { protect } = require('../middleware/authMiddleware');

const RECOMMENDED_VACCINES = [
  'BCG', 'OPV', 'DPT', 'HepB', 'MMR', 'HiB', 'Rotavirus'
];

function getAgeInMonths(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let months = (now.getFullYear() - dob.getFullYear()) * 12;
  months += now.getMonth() - dob.getMonth();
  if (now.getDate() < dob.getDate()) months -= 1;
  return Math.max(months, 0);
}

router.get('/doctor-overview', async (req, res) => {
  try {
    // Only children belonging to *any parent* — real DB data
    const children = await db.Child.findAll();

    const childIds = children.map(c => c.id);

    const records = await db.HealthRecord.findAll({
      where: { childId: childIds },
      order: [['createdAt', 'ASC']]
    });

    const byChild = {};
    records.forEach(r => {
      if (!byChild[r.childId]) byChild[r.childId] = [];
      byChild[r.childId].push(r);
    });

    const result = children.map(child => {
      const recs = byChild[child.id] || [];
      const totalRecords = recs.length;

      const vaccineNames = recs
        .filter(r => r.type === 'vaccination' && r.vaccination)
        .map(r => r.vaccination.trim().toLowerCase());

      const pendingVaccines = RECOMMENDED_VACCINES.filter(
        v => !vaccineNames.includes(v.toLowerCase())
      ).length;

      const growthRecs = recs.filter(r => r.type === 'growth');
      let growthRiskLabel = 'No Data';
      if (growthRecs.length >= 2) growthRiskLabel = 'Low';

      return {
        id: child.id,
        name: `${child.firstName} ${child.lastName || ''}`.trim(),
        ageInMonths: getAgeInMonths(child.dateOfBirth),
        totalRecords,
        pendingVaccines,
        growthRiskLabel
      };
    });

    res.json({ children: result });

  } catch (err) {
    console.error('Error in doctor-overview:', err);
    res.status(500).json({ msg: 'Failed to load doctor dashboard data' });
  }
});

// DEBUG: return assigned suggestions and childIds for current doctor
router.get('/debug-assigned', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: 'Not authorized' })
    if (req.user.role !== 'doctor') return res.status(403).json({ msg: 'Doctor-only debug endpoint' })
    const DoctorSuggestion = require('../models/DoctorSuggestion')
    const suggs = await DoctorSuggestion.findAll({ where: { doctorId: req.user.id }, attributes: ['id','childId','suggestion','createdAt'] })
    const childIds = Array.from(new Set(suggs.map(s => s.childId).filter(Boolean)))
    console.info(`[alertsRoutes] debug-assigned doctor=${req.user.id} count=${suggs.length} childIds=${JSON.stringify(childIds)}`)
    return res.json({ count: suggs.length, childIds, suggestions: suggs })
  } catch (err) {
    console.error('Error in debug-assigned:', err)
    return res.status(500).json({ msg: 'Debug failed' })
  }
})

// DEBUG: return all children with basic fields so we can see why there are 17 / unexpected rows
router.get('/debug-children', protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ msg: 'Not authorized' })
    const Child = require('../models/Child')
    const children = await Child.findAll({ attributes: ['id','firstName','lastName','dateOfBirth','gender','userId','createdAt'], order: [['createdAt','ASC']] })
    console.info(`[alertsRoutes] debug-children count=${children.length}`)
    return res.json({ count: children.length, children })
  } catch (err) {
    console.error('Error in debug-children:', err)
    return res.status(500).json({ msg: 'Debug children failed' })
  }
})

module.exports = router;

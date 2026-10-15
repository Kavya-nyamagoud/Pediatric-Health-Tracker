/**
 * WHO/CDC Recommended Vaccination Schedule
 * Standard immunization schedule for children (0-18 years)
 */

const VACCINATION_SCHEDULE = {
  'Birth': [
    { name: 'BCG', ageMonths: 0, ageRange: 'At birth' },
    { name: 'Hepatitis B (Dose 1)', ageMonths: 0, ageRange: 'At birth' },
    { name: 'Polio (IPV - Dose 1)', ageMonths: 0, ageRange: 'At birth' }
  ],
  '2 Months': [
    { name: 'Hepatitis B (Dose 2)', ageMonths: 2, ageRange: '2 months' },
    { name: 'Polio (IPV - Dose 2)', ageMonths: 2, ageRange: '2 months' },
    { name: 'Pentavalent (DPT + IPV + Hib - Dose 1)', ageMonths: 2, ageRange: '2 months' },
    { name: 'Pneumococcal (PCV - Dose 1)', ageMonths: 2, ageRange: '2 months' },
    { name: 'Rotavirus (Dose 1)', ageMonths: 2, ageRange: '2 months' }
  ],
  '4 Months': [
    { name: 'Pentavalent (DPT + IPV + Hib - Dose 2)', ageMonths: 4, ageRange: '4 months' },
    { name: 'Pneumococcal (PCV - Dose 2)', ageMonths: 4, ageRange: '4 months' },
    { name: 'Rotavirus (Dose 2)', ageMonths: 4, ageRange: '4 months' }
  ],
  '6 Months': [
    { name: 'Pentavalent (DPT + IPV + Hib - Dose 3)', ageMonths: 6, ageRange: '6 months' },
    { name: 'Hepatitis B (Dose 3)', ageMonths: 6, ageRange: '6 months' },
    { name: 'Pneumococcal (PCV - Dose 3)', ageMonths: 6, ageRange: '6 months' },
    { name: 'Rotavirus (Dose 3)', ageMonths: 6, ageRange: '6 months' },
    { name: 'Influenza (Dose 1)', ageMonths: 6, ageRange: '6 months' }
  ],
  '9 Months': [
    { name: 'Measles, Mumps, Rubella (MMR - Dose 1)', ageMonths: 9, ageRange: '9 months' },
    { name: 'Varicella (Chickenpox - Dose 1)', ageMonths: 9, ageRange: '9 months' }
  ],
  '12 Months': [
    { name: 'Meningococcal (MCV - Dose 1)', ageMonths: 12, ageRange: '12 months' }
  ],
  '15 Months': [
    { name: 'Pentavalent (DPT + IPV + Hib - Booster 1)', ageMonths: 15, ageRange: '15 months' },
    { name: 'Pneumococcal (PCV - Booster)', ageMonths: 15, ageRange: '15 months' }
  ],
  '18 Months': [
    { name: 'Polio (IPV - Booster)', ageMonths: 18, ageRange: '18 months' },
    { name: 'Japanese Encephalitis (JE)', ageMonths: 18, ageRange: '18 months' }
  ],
  '2 Years': [
    { name: 'Typhoid (Ty21a)', ageMonths: 24, ageRange: '2 years' }
  ],
  '4-6 Years': [
    { name: 'Pentavalent (DPT + IPV + Hib - Booster 2)', ageMonths: 54, ageRange: '4-6 years' },
    { name: 'MMR (Dose 2)', ageMonths: 54, ageRange: '4-6 years' },
    { name: 'Varicella (Dose 2)', ageMonths: 54, ageRange: '4-6 years' }
  ],
  '10-12 Years': [
    { name: 'Tetanus Toxoid (TT)', ageMonths: 132, ageRange: '10-12 years' },
    { name: 'HPV (if applicable)', ageMonths: 132, ageRange: '10-12 years' }
  ]
}

class VaccinationScheduleService {
  /**
   * Get recommended vaccines for a child by age
   * @param {Date} dateOfBirth - Child's date of birth
   * @returns {Array} - List of vaccines due/overdue with status
   */
  static async getRecommendedVaccines(dateOfBirth, administeredVaccines = []) {
    // Prefer AI-generated recommendations when an API key is configured. If not, use built-in schedule.
    if (process.env.OPENAI_API_KEY) {
      try {
        const VaccinationAIService = require('./vaccinationAIService')
        const records = await VaccinationAIService.generateRecommendations(dateOfBirth, administeredVaccines)
        if (Array.isArray(records) && records.length > 0) {
          return records.sort((a, b) => (a.ageMonths || 0) - (b.ageMonths || 0))
        }
      } catch (e) {
        console.debug('[VaccinationScheduleService] AI recommendation failed:', e?.message || e)
      }
    }

    // Fallback to built-in schedule
    const ageMonths = this._calculateAgeInMonths(dateOfBirth)
    const recommended = []

    Object.entries(VACCINATION_SCHEDULE).forEach(([ageGroup, vaccines]) => {
      vaccines.forEach(vaccine => {
        // Calculate if vaccine is due (with 2-week window before and 4 weeks after)
        const dueWindowStart = vaccine.ageMonths - 0.5 // 2 weeks before
        const dueWindowEnd = vaccine.ageMonths + 4 // 4 weeks after

        if (ageMonths >= dueWindowStart) {
          let status = 'upcoming'
          if (ageMonths >= vaccine.ageMonths) {
            status = ageMonths <= dueWindowEnd ? 'due' : 'overdue'
          }

          recommended.push({
            name: vaccine.name,
            ageMonths: vaccine.ageMonths,
            ageRange: vaccine.ageRange,
            dueDate: this._calculateDueDate(dateOfBirth, vaccine.ageMonths),
            status,
            daysUntilDue: Math.ceil((vaccine.ageMonths * 30.44) - (ageMonths * 30.44)) // Rough calculation
          })
        }
      })
    })

    // Sort by due date
    return recommended.sort((a, b) => a.ageMonths - b.ageMonths)
  }

  /**
   * Check vaccination status for a child
   * @param {Date} dateOfBirth - Child's date of birth
   * @param {Array} administeredVaccines - List of administered vaccines
   * @returns {Object} - Vaccination status summary
   */
  static async checkVaccinationStatus(dateOfBirth, administeredVaccines) {
    // Get the recommended schedule first
    let recommended = await this.getRecommendedVaccines(dateOfBirth, administeredVaccines)
    const ageMonths = this._calculateAgeInMonths(dateOfBirth)

    const status = {
      totalRecommended: recommended.length,
      dueVaccines: [],
      overdueVaccines: [],
      upcomingVaccines: [],
      completedVaccines: [],
      overallStatus: 'healthy'
    }

    // Normalizer used for matching
    const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()

    // Enhanced vaccine name matching with better handling of dose numbers and variations
    const isVaccineMatch = (adminName, vaccineName) => {
      if (!adminName || !vaccineName) return false;
      
      // Normalize and clean both names
      const normalizeName = (name) => {
        return (name || '').toString()
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      const a = normalizeName(adminName);
      const v = normalizeName(vaccineName);
      
      // If either string is empty after normalization, no match
      if (!a || !v) return false;
      
      // Exact match (after normalization)
      if (a === v) return true;
      
      // Check for common vaccine name variations
      const commonVariations = {
        'hepb': ['hepatitis b', 'hep b', 'hepb'],
        'dtap': ['dtp', 'dtap', 'dpt'],
        'hib': ['h influenzae', 'hib'],
        'pcv': ['pneumococcal', 'pcv'],
        'ipv': ['polio', 'ipv'],
        'mmr': ['measles mumps rubella', 'mmr']
      };
      
      // Check if either name is a variation of the other
      for (const [base, variations] of Object.entries(commonVariations)) {
        const hasBaseA = variations.some(variation => a.includes(variation));
        const hasBaseV = variations.some(variation => v.includes(variation));
        
        if (hasBaseA && hasBaseV) {
          // Both names contain the same base vaccine, now check dose numbers
          const extractDoseNumber = (s) => {
            const doseMatch = s.match(/(?:dose|d\.?)\s*(\d+)/i) || s.match(/(\d+)(?:st|nd|rd|th)?\s*(?:dose)?/i);
            return doseMatch ? parseInt(doseMatch[1], 10) : null;
          };
          
          const doseA = extractDoseNumber(a);
          const doseV = extractDoseNumber(v);
          
          // If either doesn't specify a dose, or both specify the same dose, it's a match
          if (doseA === null || doseV === null || doseA === doseV) {
            return true;
          }
        }
      }
      
      // Check for partial matches with at least one significant word in common
      const aWords = new Set(a.split(/\s+/));
      const vWords = v.split(/\s+/);
      
      // Common words to ignore in partial matching
      const ignoreWords = new Set(['vaccine', 'vaccination', 'dose', 'booster', 'injection']);
      
      // Count significant word matches
      const significantMatches = vWords.filter(word => {
        return word.length > 2 && !ignoreWords.has(word) && aWords.has(word);
      });
      
      // If at least one significant word matches, it's likely the same vaccine
      return significantMatches.length > 0;
    };

    // Build status and also mark recommended entries as completed where appropriate
    recommended = recommended.map(vaccine => {
      const isAdministered = (administeredVaccines || []).some(v => isVaccineMatch(v, vaccine.name))

      if (isAdministered) {
        status.completedVaccines.push(vaccine)
        return { ...vaccine, status: 'completed' }
      }

      if (vaccine.status === 'overdue') {
        status.overdueVaccines.push(vaccine)
      } else if (vaccine.status === 'due') {
        status.dueVaccines.push(vaccine)
      } else {
        status.upcomingVaccines.push(vaccine)
      }

      return vaccine
    })

    // Attach the enriched recommended schedule so callers can reuse it
    status.recommendedSchedule = recommended

    // Attach the enriched recommended schedule so callers can reuse it
    status.recommendedSchedule = recommended

    // Determine overall status
    if (status.overdueVaccines.length > 0) {
      status.overallStatus = 'overdue'
    } else if (status.dueVaccines.length > 0) {
      status.overallStatus = 'due'
    } else if (status.upcomingVaccines.length > 0) {
      status.overallStatus = 'upcoming'
    } else {
      status.overallStatus = 'all_up_to_date'
    }

    return status
  }

  /**
   * Generate vaccination reminders
   * @param {Date} dateOfBirth - Child's date of birth
   * @param {Array} administeredVaccines - List of administered vaccines
   * @returns {Array} - Reminder messages
   */
  static async generateReminders(dateOfBirth, administeredVaccines) {
    const status = await this.checkVaccinationStatus(dateOfBirth, administeredVaccines)
    const reminders = []

    if (status.overdueVaccines.length > 0) {
      reminders.push({
        type: 'critical',
        message: `🔴 URGENT: ${status.overdueVaccines.length} vaccine(s) overdue!`,
        details: status.overdueVaccines.map(v => v.name).join(', '),
        icon: '⚠️'
      })
    }

    if (status.dueVaccines.length > 0) {
      reminders.push({
        type: 'warning',
        message: `⚠️ ${status.dueVaccines.length} vaccine(s) due now`,
        details: status.dueVaccines.map(v => v.name).join(', '),
        icon: '📋'
      })
    }

    if (status.upcomingVaccines.length > 0 && status.upcomingVaccines.length <= 3) {
      reminders.push({
        type: 'info',
        message: `ℹ️ Upcoming: ${status.upcomingVaccines.length} vaccine(s) scheduled`,
        details: status.upcomingVaccines.slice(0, 2).map(v => v.name).join(', '),
        icon: '📅'
      })
    }

    if (status.completedVaccines.length > 0 && status.overdueVaccines.length === 0 && status.dueVaccines.length === 0) {
      reminders.push({
        type: 'success',
        message: `✅ Vaccination schedule on track!`,
        details: `${status.completedVaccines.length}/${status.totalRecommended} vaccines completed`,
        icon: '✨'
      })
    }

    return reminders
  }

  /**
   * Calculate age in months
   */
  static _calculateAgeInMonths(dateOfBirth) {
    const now = new Date()
    const birth = new Date(dateOfBirth)
    let months = (now.getFullYear() - birth.getFullYear()) * 12
    months += now.getMonth() - birth.getMonth()
    return Math.max(0, months)
  }

  /**
   * Calculate due date for a vaccine
   */
  static _calculateDueDate(dateOfBirth, ageMonths) {
    const dueDate = new Date(dateOfBirth)
    dueDate.setMonth(dueDate.getMonth() + ageMonths)
    return dueDate
  }
}

// Expose small helpers for the AI service and tests
VaccinationScheduleService._getFallbackSchedule = () => VACCINATION_SCHEDULE
VaccinationScheduleService._calculateAgeInMonths = VaccinationScheduleService._calculateAgeInMonths
VaccinationScheduleService._calculateDueDate = VaccinationScheduleService._calculateDueDate

// Expose matching helper for tests
VaccinationScheduleService._isVaccineMatch = (adminName, vaccineName) => {
  // reuse the same normalize from above to ensure consistent behavior
  const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
  const a = normalize(adminName)
  const v = normalize(vaccineName)
  const aTokens = new Set(a.split(' ').filter(t => t.length > 0))
  const vTokens = v.split(' ').filter(t => t.length > 0)
  const findNumber = (tokens) => tokens.find(t => /^\d+$/.test(t))
  const vHasDose = v.includes('dose') || v.match(/\bd\.?\b/) || findNumber(vTokens)
  const vHasBooster = v.includes('booster')

  if (vHasBooster) {
    return aTokens.has('booster') || a.includes('booster')
  }

  if (vHasDose) {
    const num = findNumber(vTokens)
    if (num) {
      return aTokens.has(num)
    }
    return a.includes('dose')
  }

  const matches = vTokens.filter(t => aTokens.has(t))
  return matches.length >= 2 || (matches.length === 1 && vTokens.length === 1 && matches[0] === vTokens[0])
}

module.exports = VaccinationScheduleService

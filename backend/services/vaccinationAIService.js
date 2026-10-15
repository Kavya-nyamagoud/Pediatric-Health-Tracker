const fetch = require('node-fetch')

/**
 * Vaccination AI service
 * - If OPENAI_API_KEY is configured, it will call OpenAI to generate age-aware recommendations.
 * - Otherwise, falls back to a heuristic generator (safe default).
 */

async function generateByHeuristic(dateOfBirth, administeredVaccines = []) {
  // Very small heuristic: pick vaccines from the built-in schedule near the child's age
  const VaccinationScheduleService = require('./vaccinationScheduleService')
  // Use internal schedule constant by calling the existing function which will return the fallback schedule
  const fallback = VaccinationScheduleService._getFallbackSchedule() || {}
  const ageMonths = VaccinationScheduleService._calculateAgeInMonths(dateOfBirth)

  // pick vaccines whose ageMonths are within +/-2 months from child age
  const candidates = []
  Object.values(fallback).forEach(group => {
    group.forEach(v => {
      const diff = Math.abs((v.ageMonths || 0) - ageMonths)
      if (diff <= 2) candidates.push(v)
    })
  })

  // remove any administered vaccines (simple name match)
  const completed = (administeredVaccines || []).map(s => (s || '').toLowerCase())
  const filtered = candidates.filter(c => !completed.some(cp => c.name.toLowerCase().includes(cp)))

  // attach status like existing service
  return filtered.map(v => ({
    name: v.name,
    ageMonths: v.ageMonths,
    ageRange: v.ageRange,
    status: (ageMonths >= v.ageMonths) ? (ageMonths <= (v.ageMonths + 1) ? 'due' : 'overdue') : 'upcoming',
    dueDate: VaccinationScheduleService._calculateDueDate(dateOfBirth, v.ageMonths)
  }))
}

async function generateWithOpenAI(dateOfBirth, administeredVaccines = []) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return null

  const ageMonths = require('./vaccinationScheduleService')._calculateAgeInMonths(dateOfBirth)
  const prompt = `You are a pediatric vaccination assistant. Produce a short JSON array of recommended vaccines for a child of ${ageMonths} months. Exclude vaccines already administered: ${JSON.stringify(administeredVaccines)}. For each item output {name, ageMonths, ageRange, recommendationReason}. Limit to 8 items.`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 400
      })
    })

    const json = await res.json()
    const content = json?.choices?.[0]?.message?.content
    if (!content) return null

    // Try to parse JSON from the model output
    const match = content.match(/\[.*\]/s)
    const arrStr = match ? match[0] : content
    const parsed = JSON.parse(arrStr)

    return parsed.map(p => ({
      name: p.name,
      ageMonths: p.ageMonths || null,
      ageRange: p.ageRange || `${p.ageMonths} months`,
      status: (ageMonths >= (p.ageMonths || 0)) ? 'due' : 'upcoming',
      dueDate: (p.ageMonths != null) ? require('./vaccinationScheduleService')._calculateDueDate(dateOfBirth, p.ageMonths) : null
    }))
  } catch (err) {
    console.error('vaccinationAIService.openai error:', err?.message || err)
    return null
  }
}

async function generateRecommendations(dateOfBirth, administeredVaccines = []) {
  // Try OpenAI first
  const aiResult = await generateWithOpenAI(dateOfBirth, administeredVaccines)
  if (Array.isArray(aiResult) && aiResult.length > 0) return aiResult

  // Fallback to heuristic
  return generateByHeuristic(dateOfBirth, administeredVaccines)
}

module.exports = {
  generateRecommendations
}

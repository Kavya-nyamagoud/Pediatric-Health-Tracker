const VaccinationScheduleService = require('./vaccinationScheduleService')

const cases = [
  { admin: 'Polio (IPV - Booster)', vaccine: 'Polio (IPV - Booster)', expect: true },
  { admin: 'Polio (IPV - Booster)', vaccine: 'Polio (IPV - Dose 1)', expect: false },
  { admin: 'Polio (IPV - Booster)', vaccine: 'Polio (IPV - Dose 2)', expect: false },
  { admin: 'Polio IPV', vaccine: 'Polio (IPV - Dose 1)', expect: false },
  { admin: 'Polio IPV 1', vaccine: 'Polio (IPV - Dose 1)', expect: true },
  { admin: 'Polio IPV Dose 1', vaccine: 'Polio (IPV - Dose 1)', expect: true },
  { admin: 'Polio', vaccine: 'Polio (IPV - Dose 1)', expect: false },
  { admin: 'MMR', vaccine: 'Measles, Mumps, Rubella (MMR - Dose 1)', expect: false },
  { admin: 'MMR Dose 1', vaccine: 'Measles, Mumps, Rubella (MMR - Dose 1)', expect: true },
]

// Use the internal heuristic by calling checkVaccinationStatus for a dummy dob and checking result
;(async () => {
  const dob = new Date(); dob.setMonth(dob.getMonth() - 18)

  for (const c of cases) {
    const res = await VaccinationScheduleService.checkVaccinationStatus(dob.toISOString(), [c.admin])
    const rec = res.recommendedSchedule.find(r => r.name === c.vaccine)
    const matched = rec && rec.status === 'completed'
    console.log(`${c.admin} -> ${c.vaccine}: expected=${c.expect} got=${matched} ${matched === c.expect ? '✅' : '❌'}`)
  }
})()

const S = require('./vaccinationScheduleService')
const fallback = S._getFallbackSchedule()

const testCases = [
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

for (const c of testCases) {
  const got = S._isVaccineMatch(c.admin, c.vaccine)
  console.log(`${c.admin} -> ${c.vaccine}: expected=${c.expect} got=${got} ${got === c.expect ? '✅' : '❌'}`)
}

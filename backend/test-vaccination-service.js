// Simple test to verify vaccination service works
const VaccinationScheduleService = require('./services/vaccinationScheduleService')

console.log('🧪 Testing Vaccination Schedule Service\n')

// Test 1: Create a child who is 6 months old
const dateOfBirth = new Date()
dateOfBirth.setMonth(dateOfBirth.getMonth() - 6)

console.log(`1. Testing with 6-month-old child (DOB: ${dateOfBirth.toLocaleDateString()})\n`)

// Test 2: Get recommended vaccines
console.log('2. Getting recommended vaccines...')
const recommended = VaccinationScheduleService.getRecommendedVaccines(dateOfBirth)
console.log(`✅ Found ${recommended.length} total vaccines in schedule`)
console.log('   First 5:')
recommended.slice(0, 5).forEach(v => {
  console.log(`   - ${v.name} (Age: ${v.ageRange})`)
})
console.log()

// Test 3: Check status with no administered vaccines
console.log('3. Checking status with NO administered vaccines...')
const status1 = VaccinationScheduleService.checkVaccinationStatus(dateOfBirth, [])
console.log('   Status Summary:')
console.log(`   - Total Recommended: ${status1.totalRecommended}`)
console.log(`   - Due Vaccines: ${status1.dueVaccines.length}`)
console.log(`   - Overdue Vaccines: ${status1.overdueVaccines.length}`)
console.log(`   - Upcoming Vaccines: ${status1.upcomingVaccines.length}`)
console.log(`   - Completed Vaccines: ${status1.completedVaccines.length}`)
console.log(`   - Overall Status: ${status1.overallStatus}`)
console.log()

// Test 4: Generate reminders
console.log('4. Generating reminders...')
const reminders1 = await VaccinationScheduleService.generateReminders(dateOfBirth, [])
console.log(`✅ Generated ${reminders1.length} reminders:`)
reminders1.forEach(r => {
  console.log(`   [${r.type.toUpperCase()}] ${r.message}`)
})
console.log()

// Test 5: Check status with some vaccinations
console.log('5. Checking status with SOME administered vaccines...')
const administeredVaccines = [
  'BCG',
  'Hepatitis B (Dose 1)',
  'Polio (IPV - Dose 1)',
  'Hepatitis B (Dose 2)',
  'Polio (IPV - Dose 2)',
  'Pentavalent (DPT + IPV + Hib - Dose 1)',
  'Pneumococcal (PCV - Dose 1)',
  'Rotavirus (Dose 1)'
]
const status2 = VaccinationScheduleService.checkVaccinationStatus(dateOfBirth, administeredVaccines)
console.log('   Status Summary:')
console.log(`   - Total Recommended: ${status2.totalRecommended}`)
console.log(`   - Due Vaccines: ${status2.dueVaccines.length}`)
console.log(`   - Overdue Vaccines: ${status2.overdueVaccines.length}`)
console.log(`   - Upcoming Vaccines: ${status2.upcomingVaccines.length}`)
console.log(`   - Completed Vaccines: ${status2.completedVaccines.length}`)
console.log(`   - Overall Status: ${status2.overallStatus}`)
console.log()

// Test 6: Generate reminders with some vaccinations
console.log('6. Generating reminders with partial vaccinations...')
const reminders2 = await VaccinationScheduleService.generateReminders(dateOfBirth, administeredVaccines)
console.log(`✅ Generated ${reminders2.length} reminders:`)
reminders2.forEach(r => {
  console.log(`   [${r.type.toUpperCase()}] ${r.message}`)
})
console.log()

console.log('✅ All tests completed successfully!')

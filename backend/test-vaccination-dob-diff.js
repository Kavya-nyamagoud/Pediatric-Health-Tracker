const VaccinationScheduleService = require('./services/vaccinationScheduleService')

function isoMonthsAgo(months) {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString()
}

async function test() {
  try {
    console.log('🧪 Testing: Different DOBs produce different vaccination schedules')

    const dobNewborn = isoMonthsAgo(0)
    const dobSixMonths = isoMonthsAgo(6)
    const dobTwelveMonths = isoMonthsAgo(12)

    const schedNewborn = VaccinationScheduleService.getRecommendedVaccines(dobNewborn)
    const schedSix = VaccinationScheduleService.getRecommendedVaccines(dobSixMonths)
    const schedYear = VaccinationScheduleService.getRecommendedVaccines(dobTwelveMonths)

    // Show next upcoming/due vaccine names for debugging
    const upcomingNew = schedNewborn.filter(s => s.status === 'upcoming').map(s => s.name)
    const upcomingSix = schedSix.filter(s => s.status === 'upcoming').map(s => s.name)
    const upcomingYear = schedYear.filter(s => s.status === 'upcoming').map(s => s.name)

    console.log('\nUpcoming newborn:', upcomingNew.slice(0,6))
    console.log('Upcoming 6-month:', upcomingSix.slice(0,6))
    console.log('Upcoming 12-month:', upcomingYear.slice(0,6))

    // Basic assertions: counts of due/overdue should increase with age
    const dueCountNew = schedNewborn.filter(s => ['due','overdue'].includes(s.status)).length
    const dueCountSix = schedSix.filter(s => ['due','overdue'].includes(s.status)).length
    const dueCountYear = schedYear.filter(s => ['due','overdue'].includes(s.status)).length

    console.log('\nDue/overdue counts -> newborn:', dueCountNew, '6-month:', dueCountSix, '12-month:', dueCountYear)

    if (dueCountSix <= dueCountNew) {
      console.error('❌ Failure: 6-month due/overdue count not greater than newborn')
      process.exit(1)
    }

    if (dueCountYear <= dueCountSix) {
      console.error('❌ Failure: 12-month due/overdue count not greater than 6-month')
      process.exit(1)
    }

    console.log('\n✅ Success: Different DOBs produced different schedules')
    process.exit(0)
  } catch (err) {
    console.error('❌ Error running test:', err)
    process.exit(2)
  }
}

test()

(async () => {
  try {
    const VaccinationScheduleService = require('./vaccinationScheduleService')
    const d = new Date(); d.setMonth(d.getMonth() - 18)
    const administered = ['Polio (IPV - Booster)']
    const status = await VaccinationScheduleService.checkVaccinationStatus(d.toISOString(), administered)
    console.log('status:', JSON.stringify(status, null, 2))
    const rec = status.recommendedSchedule.filter(r => r.name.toLowerCase().includes('polio'))
    console.log('polio entries:', JSON.stringify(rec, null, 2))
  } catch (e) {
    console.error(e)
  }
})()

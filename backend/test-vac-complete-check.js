(async () => {
  try {
    const base = 'http://localhost:5000/api'
    const regRes = await fetch(base + '/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Vac Tester', email: `vac-tester-${Date.now()}@example.com`, password: 'test123' })
    })
    const reg = await regRes.json()
    if (!reg || !reg.token) {
      console.error('Register failed', reg)
      return
    }
    const token = reg.token

    // create child
    const d = new Date(); d.setMonth(d.getMonth() - 18) // 18 months old
    const createRes = await fetch(base + '/children', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ firstName: 'VacChild', lastName: 'Test', dateOfBirth: d.toISOString(), gender: 'female' })
    })
    const childResp = await createRes.json()
    const child = childResp && childResp.id ? childResp : (childResp && childResp.data ? childResp.data : null)
    if (!child || !child.id) {
      console.error('Failed to create child:', childResp)
      return
    }
    console.log('child created:', child)

    // Add vaccination record (administered)
    const addRes = await fetch(base + '/health', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ childId: child.id, type: 'vaccination', vaccination: 'Polio (IPV - Booster)', dateAdministered: new Date().toISOString(), notes: 'administered' })
    })
    const added = await addRes.json()
    console.log('added health record:', added)

    // Fetch health records
    const recRes = await fetch(`${base}/health?childId=${child.id}`, { headers: { Authorization: `Bearer ${token}` } })
    const recs = await recRes.json()
    console.log('health records:', recs.records && recs.records.map(r => ({ id: r.id, vaccination: r.vaccination, createdAt: r.createdAt, dateAdministered: r.dateAdministered })))

    // Fetch single health record (GET /health/:id)
    const recordId = added && added.id
    if (recordId) {
      const singleRes = await fetch(`${base}/health/${recordId}`, { headers: { Authorization: `Bearer ${token}` } })
      const single = await singleRes.json()
      console.log('single health record:', single)
    }

    // Fetch vaccination status (via API)
    const vacRes = await fetch(`${base}/children/${child.id}/vaccination-status`, { headers: { Authorization: `Bearer ${token}` } })
    const vac = await vacRes.json()
    console.log('vaccination-status:', JSON.stringify(vac, null, 2))

    // Also call schedule service directly to inspect matching behavior
    try {
      const VaccinationScheduleService = require('./services/vaccinationScheduleService')
      const administeredVaccines = (recs.records || []).filter(r => r && r.type === 'vaccination').map(r => (r.vaccination||'').trim())
      const statusDirect = await VaccinationScheduleService.checkVaccinationStatus(child.dateOfBirth, administeredVaccines)
      const recommendedDirect = await VaccinationScheduleService.getRecommendedVaccines(child.dateOfBirth, administeredVaccines)
      console.log('direct status:', JSON.stringify(statusDirect, null, 2))
      console.log('direct recommended (last 5):', recommendedDirect.slice(-5))

      // replicate controller mapping here to see why recommended wasn't marked completed
      const normalize = s => (s || '').toString().toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
      recommendedDirect.forEach(v => {
        const short = normalize(v.name.split('(')[0].trim())
        const full = normalize(v.name)
        const recNames = (recs.records || []).map(r => normalize(r.vaccination || r.vaccine || r.vaccineName || r.name))
        const found = recNames.find(name => name && (name.includes(short) || short.includes(name) || name.includes(full) || full.includes(name)))
        if (found) {
          console.log('MAPPED:', v.name, '-> matched with record name:', found)
        }
      })

    } catch (e) {
      console.error('service direct call failed', e)
    }

  } catch (err) {
    console.error('error', err)
  }
})()

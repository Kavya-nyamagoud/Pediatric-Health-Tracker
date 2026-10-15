(async () => {
  try {
    const base = 'http://localhost:5000/api'
    const regRes = await fetch(base + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test User', email: `test-${Date.now()}@example.com`, password: 'test123' })
    })
    const reg = await regRes.json()
    if (!reg || !reg.token) {
      console.error('Register failed', reg)
      return
    }
    const token = reg.token

    const create = async monthsAgo => {
      const d = new Date(); d.setMonth(d.getMonth() - monthsAgo)
      const res = await fetch(base + '/children', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ firstName: `Child${monthsAgo}`, lastName: 'Test', dateOfBirth: d.toISOString(), gender: 'M' })
      })
      return await res.json()
    }

    const ch0 = await create(0)
    const ch6 = await create(6)
    console.log('created', ch0.id || ch0, ch6.id || ch6)

    const fetchStatus = async (childId) => {
      const res = await fetch(`${base}/children/${childId}/vaccination-status`, { headers: { Authorization: `Bearer ${token}` }})
      return await res.json()
    }

    const s0 = await fetchStatus(ch0.id)
    const s6 = await fetchStatus(ch6.id)

    console.log('\n0 months recommended (top 6):', (s0.recommendedSchedule || []).slice(0,6).map(x=>x.name))
    console.log('6 months recommended (top 6):', (s6.recommendedSchedule || []).slice(0,6).map(x=>x.name))
    console.log('\n0 months reminders:', s0.reminders)
    console.log('6 months reminders:', s6.reminders)
  } catch (err) {
    console.error('error', err)
  }
})()
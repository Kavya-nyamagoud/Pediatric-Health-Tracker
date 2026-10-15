async function test() {
  try {
    console.log('🧪 Testing Vaccination Status Endpoint\n')

    const BASE_URL = 'http://localhost:5000/api'
    let token = ''

    // Register user
    console.log('1. Registering user...')
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-vac-${Date.now()}@test.com`,
        password: 'test123'
      })
    })
    const regData = await regRes.json()
    token = regData.token
    console.log('✅ User registered\n')

    // Create child
    console.log('2. Creating child (6 months old)...')
    const childRes = await fetch(`${BASE_URL}/children`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        firstName: 'Vaccination',
        lastName: 'Test',
        dateOfBirth: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString(),
        gender: 'M'
      })
    })
    const childData = await childRes.json()
    const childId = childData.id
    console.log(`✅ Child created: ${childId}\n`)

    // Call vaccination status endpoint
    console.log('3. Calling vaccination status endpoint...')
    const vacRes = await fetch(`${BASE_URL}/children/${childId}/vaccination-status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const vacData = await vacRes.json()
    console.log('✅ Vaccination status retrieved:\n')
    console.log(JSON.stringify(vacData, null, 2))

    // Check for reminders
    if (vacData.reminders.length > 0) {
      console.log('\n📢 Reminders generated:')
      vacData.reminders.forEach(r => {
        console.log(`  - [${r.type}] ${r.message}`)
      })
    }

    // Check recommended schedule
    if (vacData.recommendedSchedule.length > 0) {
      console.log('\n📅 Recommended vaccines (first 5):')
      vacData.recommendedSchedule.slice(0, 5).forEach(v => {
        console.log(`  - ${v.name} (${v.ageRange})`)
      })
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

test()

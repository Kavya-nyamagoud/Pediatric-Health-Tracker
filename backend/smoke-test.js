(async () => {
  try {
    console.log('Starting smoke test (login → create child → add record → fetch lists)')

    // Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jane@test.com', password: 'Test1234' })
    })
    const loginData = await loginRes.json()
    console.log('Login status:', loginRes.status)
    if (!loginData.token) {
      console.error('Login failed:', JSON.stringify(loginData, null, 2))
      return
    }
    const token = loginData.token
    console.log('Logged in, token length:', token.length)

    // Create child
    const childRes = await fetch('http://localhost:5000/api/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ firstName: 'Smoke', lastName: 'Tester', dateOfBirth: '2024-02-02', gender: 'other' })
    })
    const childData = await childRes.json()
    console.log('Create child status:', childRes.status)
    console.log('Child response:', JSON.stringify(childData, null, 2))
    const childId = childData.id
    if (!childId) {
      console.error('Failed to create child; stopping.')
      return
    }

    // Create health record
    const healthRes = await fetch('http://localhost:5000/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ childId, type: 'growth', height: 60, weight: 5.5, notes: 'Smoke test record' })
    })
    const healthData = await healthRes.json()
    console.log('Create health status:', healthRes.status)
    console.log('Health response:', JSON.stringify(healthData, null, 2))

    // Fetch children
    const childrenRes = await fetch('http://localhost:5000/api/children', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const childrenData = await childrenRes.json()
    console.log('Get children status:', childrenRes.status)
    console.log('Children:', JSON.stringify(childrenData, null, 2))

    // Fetch health records
    const recordsRes = await fetch(`http://localhost:5000/api/health?childId=${childId}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const recordsData = await recordsRes.json()
    console.log('Get records status:', recordsRes.status)
    console.log('Records:', JSON.stringify(recordsData, null, 2))

    console.log('Smoke test completed.')
  } catch (err) {
    console.error('Error during smoke test:', err)
  }
})()

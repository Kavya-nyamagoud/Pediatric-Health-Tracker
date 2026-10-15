(async () => {
  try {
    console.log('Testing AI Growth Prediction Endpoint...\n')

    // Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jane@test.com', password: 'Test1234' })
    })
    const loginData = await loginRes.json()
    const token = loginData.token
    console.log('✅ Logged in')

    // Get a child with records
    const childrenRes = await fetch('http://localhost:5000/api/children', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    })
    const children = await childrenRes.json()
    const childId = children[0].id
    console.log(`Using child ID: ${childId}`)

    // Call AI prediction endpoint
    console.log('\n📊 Calling AI prediction endpoint...')
    const predictionRes = await fetch('http://localhost:5000/api/health/predict/growth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ childId })
    })

    if (!predictionRes.ok) {
      console.error('Prediction failed:', predictionRes.status, await predictionRes.text())
      return
    }

    const prediction = await predictionRes.json()
    console.log('\n🤖 AI Prediction Result:')
    console.log(JSON.stringify(prediction, null, 2))
    
    console.log('\n✅ AI Growth Prediction test completed successfully!')
  } catch (err) {
    console.error('Error during AI prediction test:', err)
  }
})()

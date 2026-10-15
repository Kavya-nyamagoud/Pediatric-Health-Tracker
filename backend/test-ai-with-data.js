(async () => {
  try {
    console.log('Testing AI Growth Prediction with Multiple Records...\n')

    // Login
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jane@test.com', password: 'Test1234' })
    })
    const loginData = await loginRes.json()
    const token = loginData.token
    console.log('✅ Logged in')

    // Create a test child
    const childRes = await fetch('http://localhost:5000/api/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        firstName: 'Growth',
        lastName: 'TestChild',
        dateOfBirth: '2023-01-15',
        gender: 'male',
        bloodType: 'O+'
      })
    })
    const childData = await childRes.json()
    const childId = childData.id
    console.log(`✅ Created child: ${childData.firstName} ${childData.lastName} (ID: ${childId})`)

    // Add multiple growth records (simulate growth over 6 months)
    console.log('\n📝 Adding 6 growth records (simulating 6-month growth)...')
    const heights = [60, 62.5, 65, 67.5, 70, 72.5]
    const weights = [4.5, 5.0, 5.5, 6.0, 6.5, 7.0]

    for (let i = 0; i < heights.length; i++) {
      await fetch('http://localhost:5000/api/health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          childId,
          type: 'growth',
          height: heights[i],
          weight: weights[i],
          bmi: weights[i] / ((heights[i] / 100) ** 2),
          notes: `Month ${i + 1} checkup`
        })
      })
      console.log(`  Record ${i + 1}: Height ${heights[i]}cm, Weight ${weights[i]}kg`)
    }

    // Call AI prediction endpoint
    console.log('\n🤖 Calling AI prediction endpoint...')
    const predictionRes = await fetch('http://localhost:5000/api/health/predict/growth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ childId })
    })

    const prediction = await predictionRes.json()
    console.log('\n📊 AI Prediction Result:')
    console.log(JSON.stringify(prediction, null, 2))

    console.log('\n✅ AI Growth Prediction test with data completed successfully!')
  } catch (err) {
    console.error('Error during AI prediction test:', err)
  }
})()

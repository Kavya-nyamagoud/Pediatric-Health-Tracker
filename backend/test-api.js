// Test API endpoints
const testAPI = async () => {
  console.log("Testing Pediatric Health Tracker API...\n");

  // Test 1: Register
  console.log("1️⃣  Testing POST /api/auth/register");
  const registerRes = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Jane Doe",
      email: "jane@test.com",
      password: "Test1234"
    })
  });
  const registerData = await registerRes.json();
  console.log("Status:", registerRes.status);
  console.log("Response:", JSON.stringify(registerData, null, 2));

  if (!registerData.token) {
    console.error("❌ Registration failed. Stopping tests.");
    return;
  }

  const token = registerData.token;
  console.log("\n✅ Registration successful. Token received.\n");

  // Test 2: Create Child
  console.log("2️⃣  Testing POST /api/children");
  const createChildRes = await fetch("http://localhost:5000/api/children", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      firstName: "Emma",
      lastName: "Doe",
      dateOfBirth: "2022-03-15",
      gender: "female",
      bloodType: "O+"
    })
  });
  const childData = await createChildRes.json();
  console.log("Status:", createChildRes.status);
  console.log("Response:", JSON.stringify(childData, null, 2));

  if (!childData.id) {
    console.error("❌ Creating child failed. Stopping tests.");
    return;
  }

  const childId = childData.id;
  console.log("\n✅ Child created successfully. Child ID:", childId, "\n");

  // Test 3: Create Health Record
  console.log("3️⃣  Testing POST /api/health");
  const createHealthRes = await fetch("http://localhost:5000/api/health", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      childId,
      type: "growth",
      height: 85.5,
      weight: 12.5,
      bmi: 17.2,
      notes: "Regular checkup"
    })
  });
  const healthData = await createHealthRes.json();
  console.log("Status:", createHealthRes.status);
  console.log("Response:", JSON.stringify(healthData, null, 2));

  if (!healthData.id) {
    console.error("❌ Creating health record failed.");
    return;
  }

  console.log("\n✅ Health record created successfully.\n");

  // Test 4: Get all children
  console.log("4️⃣  Testing GET /api/children");
  const getChildrenRes = await fetch("http://localhost:5000/api/children", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
  const childrenData = await getChildrenRes.json();
  console.log("Status:", getChildrenRes.status);
  console.log("Response:", JSON.stringify(childrenData, null, 2));

  // Test 5: Get health records for child
  console.log("\n5️⃣  Testing GET /api/health?childId=" + childId);
  const getHealthRes = await fetch(
    `http://localhost:5000/api/health?childId=${childId}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  const healthRecordsData = await getHealthRes.json();
  console.log("Status:", getHealthRes.status);
  console.log("Response:", JSON.stringify(healthRecordsData, null, 2));

  console.log("\n✅ All tests completed successfully!");
};

testAPI().catch(console.error);

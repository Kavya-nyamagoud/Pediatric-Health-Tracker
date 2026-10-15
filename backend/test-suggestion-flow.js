(async () => {
  try {
    const BASE = 'http://localhost:5000/api'
    // Create parent
    const parentReg = await fetch(`${BASE}/auth/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name: 'Test Parent', email:`parent-${Date.now()}@test.local`, password:'test123'})})
    const parent = await parentReg.json()
    console.log('parent register response:', parent)
    const parentToken = parent.token

    // Create doctor user and promote to doctor role by updating DB directly
    const doctorReg = await fetch(`${BASE}/auth/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name: 'Test Doctor', email:`doctor-${Date.now()}@test.local`, password:'test123'})})
    const doctor = await doctorReg.json()
    console.log('doctor register response:', doctor)
    const doctorToken = doctor.token

    // Promote the doctor user via DB update (response includes user object)
    const { User } = require('./models')
    const doctorId = doctor.user && doctor.user.id
    if (!doctorId) throw new Error('Could not find created doctor id in response')
    await User.update({ role: 'doctor' }, { where: { id: doctorId } })

    // Create child as parent
    const d = new Date(); d.setMonth(d.getMonth() - 6)
    const createRes = await fetch(`${BASE}/children`, {method:'POST', headers:{'Content-Type':'application/json', 'Authorization': `Bearer ${parentToken}`}, body: JSON.stringify({ firstName: 'SugTest', lastName: 'Kid', dateOfBirth: d.toISOString(), gender: 'female' })})
    const child = await createRes.json()
    console.log('child create response:', child)
    const childId = child.id || child.data?.id || (child && child.success && child.data && child.data.id)
    // Doctor creates a suggestion
    const sres = await fetch(`${BASE}/children/${childId}/suggestions`, {method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${doctorToken}`}, body: JSON.stringify({ suggestion: 'Please check growth parameters' })})
    const suggestion = await sres.json()
    console.log('doctor created suggestion:', suggestion)

    // Parent lists suggestions
    const listRes = await fetch(`${BASE}/children/${childId}/suggestions`, {headers: { Authorization: `Bearer ${parentToken}` }})
    const list = await listRes.json()
    console.log('parent sees suggestions:', list)

    // Parent marks completed
    const completeRes = await fetch(`${BASE}/children/${childId}/suggestions/${suggestion.id}/complete`, {method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${parentToken}`}, body: JSON.stringify({ note: 'Done at home' })})
    const completeJson = await completeRes.json()
    console.log('complete response:', completeJson)

    // Doctor polls suggestions
    const docList = await (await fetch(`${BASE}/children/${childId}/suggestions`, {headers: { Authorization: `Bearer ${doctorToken}` }})).json()
    console.log('doctor sees suggestions with completion:', docList)

  } catch (err) {
    console.error('error', err)
  }
})()

(async () => {
  try {
    const BASE = 'http://localhost:5000/api'
    // register parent
    const parentRes = await (await fetch(`${BASE}/auth/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:'Assign Parent', email:`assign-parent-${Date.now()}@test.local`, password:'test123'})})).json()
    const parentToken = parentRes.token

    // create child
    const d = new Date(); d.setMonth(d.getMonth() - 6)
    const child = await (await fetch(`${BASE}/children`, {method:'POST', headers:{'Content-Type':'application/json', Authorization: `Bearer ${parentToken}`}, body: JSON.stringify({firstName:'Assigned', lastName:'Child', dateOfBirth: d.toISOString(), gender:'female'})})).json()
    console.log('created child:', child.id)

    // register doctor
    const docRes = await (await fetch(`${BASE}/auth/register`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name:'Assign Doctor', email:`assign-doctor-${Date.now()}@test.local`, password:'test123'})})).json()
    // promote to doctor in DB
    const { User } = require('./models')
    await User.update({ role: 'doctor' }, { where: { id: docRes.user.id } })

    // doctor login and token (re-login to get role reflected)
    const login = await (await fetch(`${BASE}/auth/login`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email: docRes.user.email, password:'test123'})})).json()
    const docToken = login.token

    // doctor fetch assigned children BEFORE suggestion -> should be empty
    const before = await (await fetch(`${BASE}/children?assigned=true`, {headers: { Authorization: `Bearer ${docToken}` }})).json()
    console.log('assigned before:', before.length || before)

    // doctor creates suggestion for child
    const createS = await (await fetch(`${BASE}/children/${child.id}/suggestions`, {method:'POST', headers:{'Content-Type':'application/json', Authorization: `Bearer ${docToken}`}, body: JSON.stringify({ suggestion: 'Check weight' })})).json()
    console.log('created suggestion:', createS.id || createS)

    // doctor fetch assigned children AFTER suggestion -> should include created child
    const after = await (await fetch(`${BASE}/children?assigned=true`, {headers: { Authorization: `Bearer ${docToken}` }})).json()
    console.log('assigned after count:', Array.isArray(after) ? after.length : after)

  } catch (e) {
    console.error('error', e)
  }
})()
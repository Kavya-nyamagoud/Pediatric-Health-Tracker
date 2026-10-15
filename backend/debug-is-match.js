const normalize = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim()
const isVaccineMatch = (adminName, vaccineName) => {
  if (!adminName || !vaccineName) return false
  const a = normalize(adminName)
  const v = normalize(vaccineName)
  const aTokens = new Set(a.split(' ').filter(t => t.length > 1))
  const vTokens = v.split(' ').filter(t => t.length > 1)

  const findNumber = (tokens) => tokens.find(t => /^\d+$/.test(t))
  const vHasDose = v.includes('dose') || v.match(/\bd\.?\b/) || findNumber(vTokens)
  const vHasBooster = v.includes('booster')

  console.log('admin:', adminName, '->', a)
  console.log('vaccine:', vaccineName, '->', v)
  console.log('aTokens:', Array.from(aTokens))
  console.log('vTokens:', vTokens)
  console.log('vHasDose', vHasDose, 'vHasBooster', vHasBooster)

  if (vHasBooster) {
    const res = aTokens.has('booster') || a.includes('booster')
    console.log('booster check ->', res)
    return res
  }

  if (vHasDose) {
    const num = findNumber(vTokens)
    if (num) {
      const res = aTokens.has(num) || a.includes('dose') || a.includes('dose')
      console.log('dose with number check ->', res)
      return res
    }
    const res = a.includes('dose')
    console.log('dose without number check ->', res)
    return res
  }

  const matches = vTokens.filter(t => aTokens.has(t))
  console.log('token matches ->', matches)
  const res = matches.length >= 2 || (matches.length === 1 && vTokens.length === 1 && matches[0] === vTokens[0])
  console.log('final fallback ->', res)
  return res
}

console.log(isVaccineMatch('Polio (IPV - Booster)', 'Polio (IPV - Dose 1)'))
console.log(isVaccineMatch('Polio (IPV - Booster)', 'Polio (IPV - Dose 2)'))
console.log(isVaccineMatch('Polio (IPV - Booster)', 'Polio (IPV - Booster)'))
console.log(isVaccineMatch('Polio IPV Booster', 'Polio (IPV - Dose 1)'))
console.log(isVaccineMatch('Polio IPV', 'Polio (IPV - Dose 1)'))
console.log(isVaccineMatch('Polio', 'Polio (IPV - Dose 1)'))

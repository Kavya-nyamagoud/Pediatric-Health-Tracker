// backend/scripts/list_assigned_counts.js
const db = require('../models');

async function main(){
  const suggs = await db.DoctorSuggestion.findAll({ attributes: ['doctorId', 'childId'] });
  const byDoctor = {};
  suggs.forEach(s => {
    const d = s.doctorId;
    const c = s.childId;
    if (!byDoctor[d]) byDoctor[d] = new Set();
    if (c) byDoctor[d].add(c);
  });

  const doctors = Object.keys(byDoctor);
  for (const did of doctors){
    const doc = await db.User.findByPk(did);
    console.log(`Doctor ${did} (${doc ? doc.name : 'unknown'}) -> ${byDoctor[did].size} unique childId(s):`, Array.from(byDoctor[did]));
  }

  if (doctors.length === 0) console.log('No DoctorSuggestion entries found');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
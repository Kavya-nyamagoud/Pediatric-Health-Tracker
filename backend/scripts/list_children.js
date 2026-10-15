// backend/scripts/list_children.js
const db = require('../models');

async function main(){
  try {
    const children = await db.Child.findAll({ attributes: ['id','firstName','lastName','dateOfBirth','gender','userId','createdAt'], order: [['createdAt','ASC']] });
    console.log(`Found ${children.length} Child rows:`);
    children.forEach(c => {
      const o = c.get({ plain: true });
      console.log(o);
    });
    process.exit(0);
  } catch (e) {
    console.error('Failed to list children:', e);
    process.exit(1);
  }
}

main();
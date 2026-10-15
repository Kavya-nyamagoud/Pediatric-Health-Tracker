const db = require('../models');
(async () => {
  try {
    await db.sequelize.authenticate();
    const doctors = await db.User.findAll({ where: { role: 'doctor' }, attributes: ['id','name','email','role'] });
    console.log('Doctors:', doctors.map(d => d.get({ plain: true })));
    process.exit(0);
  } catch (err) {
    console.error('Error', err);
    process.exit(1);
  }
})();

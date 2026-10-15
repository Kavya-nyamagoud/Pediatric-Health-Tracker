const { sequelize } = require('./sequelize');
const { User, Child, GrowthRecord, VaccinationRecord, MedicalHistory } = require('./models');

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    await sequelize.sync({ alter: true });
    console.log('Database synced successfully');
  } catch (error) {
    console.error('Error syncing database:', error);
  } finally {
    await sequelize.close();
  }
})()
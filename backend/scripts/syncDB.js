const { sequelize } = require('../sequelize');
const { User, Child, GrowthRecord, VaccinationRecord, MedicalHistory } = require('../models');

const syncDatabase = async () => {
  try {
    // Test the connection
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Sync all models
    await sequelize.sync({ force: false, alter: true });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Unable to sync the database:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

syncDatabase();
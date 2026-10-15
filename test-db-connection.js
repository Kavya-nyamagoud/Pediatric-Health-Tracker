// Test database connection
require('dotenv').config();
const { Sequelize } = require('sequelize');

const DB_NAME = process.env.DB_NAME || "pediatric";
const DB_USER = process.env.DB_USER || "postgres";
const DB_PASS = process.env.DB_PASSWORD || "";
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || 5432;

console.log('Testing database connection with the following settings:');
console.log(`- Host: ${DB_HOST}:${DB_PORT}`);
console.log(`- Database: ${DB_NAME}`);
console.log(`- User: ${DB_USER}`);
console.log(`- Password: ${DB_PASS ? '*****' : '(empty)'}`);

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASS, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: console.log, // Enable logging
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection has been established successfully.');
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT version()');
    console.log('✅ Database version:', results[0].version);
    
    // Check if the database has any tables
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    console.log(`✅ Found ${tables.length} tables in the database.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

testConnection();

#!/usr/bin/env node
/* Reset DB script - drops and recreates all tables using Sequelize
   WARNING: destructive. Use only in development. */

const path = require('path');

// Load environment variables so DB credentials are available
require('dotenv').config();

async function reset() {
  try {
    // Load models which also initializes sequelize via models/index.js
    const db = require(path.join(__dirname, '..', 'models'));

    console.log('Dropping and recreating all tables (force sync) - this will erase data...');
    await db.sequelize.sync({ force: true });
    console.log('✅ Database reset complete. Tables recreated.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting database:', err);
    process.exit(1);
  }
}

reset();

// Simple PostgreSQL connection test without external dependencies
const { Client } = require('pg');

const config = {
  user: 'postgres',
  host: 'localhost',
  database: 'pediatric',
  password: 'kavya1245',
  port: 5432,
};

console.log('Attempting to connect to PostgreSQL database...');
console.log('Configuration:', JSON.stringify({
  ...config,
  password: '*****' // Don't log the actual password
}, null, 2));

const client = new Client(config);

client.connect()
  .then(() => {
    console.log('✅ Successfully connected to PostgreSQL');
    return client.query('SELECT version()');
  })
  .then((res) => {
    console.log('✅ PostgreSQL version:', res.rows[0].version);
    return client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  })
  .then((res) => {
    console.log(`✅ Found ${res.rows.length} tables in the database`);
    if (res.rows.length > 0) {
      console.log('First few tables:', res.rows.slice(0, 5).map(r => r.table_name).join(', '));
      if (res.rows.length > 5) console.log('... and', res.rows.length - 5, 'more');
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Error connecting to PostgreSQL:', err);
    console.error('Error details:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    });
    process.exit(1);
  })
  .finally(() => {
    client.end();
  });

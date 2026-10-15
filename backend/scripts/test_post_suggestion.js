const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

(async () => {
  try {
    const token = jwt.sign({ id: 8 }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '30d' });
    console.log('Using token:', token);

    console.log('\nGETting child /api/children/8 ...');
    const childRes = await axios.get('http://localhost:5000/api/children/8', { headers: { Authorization: `Bearer ${token}` } });
    console.log('Child Status:', childRes.status);
    console.log('Child Body:', JSON.stringify(childRes.data, null, 2));

    console.log('\nPOSTing to /api/children (should be forbidden for doctor)...');
    try {
      const createRes = await axios.post('http://localhost:5000/api/children', { firstName: 'X', lastName: 'Y' }, { headers: { Authorization: `Bearer ${token}` } });
      console.log('Create child status:', createRes.status, createRes.data);
    } catch (err) {
      console.error('Create child expected error:', err.response ? err.response.status : err.message, err.response ? err.response.data : '');
    }

    console.log('\nPOSTing suggestion...');
    const postRes = await axios.post('http://localhost:5000/api/children/8/suggestions', { suggestion: 'Test suggestion from script' }, { headers: { Authorization: `Bearer ${token}` } });
    console.log('POST Status:', postRes.status);
    console.log('POST Body:', JSON.stringify(postRes.data, null, 2));

    console.log('\nGETting suggestions...');
    const getRes = await axios.get('http://localhost:5000/api/children/8/suggestions', { headers: { Authorization: `Bearer ${token}` } });
    console.log('GET Status:', getRes.status);
    console.log('GET Body:', JSON.stringify(getRes.data, null, 2));

  } catch (err) {
    console.error('Error making request:');
    if (err.response) {
      console.error('Response error status:', err.response.status);
      console.error('Response error body:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('Request error message:', err.message);
    }
    process.exit(1);
  }
})();

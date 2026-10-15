const jwt = require('jsonwebtoken');
const axios = require('axios');

(async ()=>{
  try{
    const token = jwt.sign({id:5}, process.env.JWT_SECRET || 'supersecretkey123');
    console.log('Using token for user id 5 (parent)');
    const res = await axios.get('http://localhost:5000/api/children', { headers: { Authorization: `Bearer ${token}` } });
    console.log('STATUS', res.status);
    console.log(JSON.stringify(res.data, null, 2));
  }catch(e){
    if (e.response) {
      console.error('ERR', e.response.status, e.response.data);
    } else {
      console.error('ERR', e.message || e);
    }
    process.exit(1);
  }
})();

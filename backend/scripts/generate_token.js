const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 8 }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '30d' });
console.log(token);

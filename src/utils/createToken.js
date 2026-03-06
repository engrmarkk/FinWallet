// generate token
const jwt = require('jsonwebtoken');

const createToken = (id, userAgent) => {
  return jwt.sign(
    { id, userAgent, jti: Math.random().toString(36).substring(2) + Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

module.exports = createToken;

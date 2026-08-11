const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateJWT = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = { generateJWT, generateRandomToken, generateVerificationCode };

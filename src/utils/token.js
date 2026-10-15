const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { jwt: jwtCfg } = require('../config/env');

const signAccessToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, jwtCfg.accessSecret, {
    expiresIn: jwtCfg.accessExpiresIn,
  });

const verifyAccessToken = (token) => jwt.verify(token, jwtCfg.accessSecret);

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const generateRefreshToken = () => {
  const token = crypto.randomBytes(48).toString('hex');
  return { token, hash: hashToken(token) };
};

module.exports = { signAccessToken, verifyAccessToken, hashToken, generateRefreshToken };
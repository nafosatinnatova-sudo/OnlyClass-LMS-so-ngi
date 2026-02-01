const jwt = require("jsonwebtoken");
const { sha256, uuid } = require("../utils/crypto");

function createAccessToken({ user, config }) {
  return jwt.sign(
    {
      sub: String(user._id),
      role: user.role,
      tv: user.tokenVersion
    },
    config.JWT_ACCESS_SECRET,
    { expiresIn: config.accessTtlSeconds }
  );
}

function createRefreshToken({ user, config }) {
  const jti = uuid();
  const token = jwt.sign(
    {
      sub: String(user._id),
      tv: user.tokenVersion,
      jti
    },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.refreshTtlSeconds }
  );
  return { token, tokenHash: sha256(token) };
}

function verifyAccessToken({ token, config }) {
  return jwt.verify(token, config.JWT_ACCESS_SECRET);
}

function verifyRefreshToken({ token, config }) {
  return jwt.verify(token, config.JWT_REFRESH_SECRET);
}

module.exports = {
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};


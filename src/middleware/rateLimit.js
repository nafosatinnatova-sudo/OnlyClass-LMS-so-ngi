const rateLimit = require("express-rate-limit");

function makeLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message }
  });
}

// Strict limiter for brute-force sensitive endpoints (login/register)
const authStrictLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many auth attempts, try again later"
});

// Looser limiter for other auth endpoints (refresh/logout)
const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: "Too many auth requests, try again later"
});

const apiLimiter = makeLimiter({
  windowMs: 60 * 1000,
  max: 240,
  message: "Too many requests"
});

module.exports = { authStrictLimiter, authLimiter, apiLimiter };


const rateLimit = require('express-rate-limit');

// Auth endpoints are the ones worth brute-forcing (login, OTP, password reset),
// so they get a tight window. AI endpoints are metered because each call costs
// money upstream.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again in a few minutes.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'You are sending AI requests too quickly. Please slow down.' },
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

module.exports = { authLimiter, aiLimiter, apiLimiter };

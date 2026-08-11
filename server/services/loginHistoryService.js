const { UAParser } = require('ua-parser-js');
const LoginHistory = require('../models/LoginHistory');

const summarizeDevice = (userAgentString) => {
  if (!userAgentString) return 'Unknown device';
  const { browser, os } = UAParser(userAgentString);
  const browserPart = browser.name || 'Unknown browser';
  const osPart = os.name || 'Unknown OS';
  return `${browserPart} on ${osPart}`;
};

const recordLogin = async (userId, req) => {
  try {
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
    const device = summarizeDevice(req.headers['user-agent']);
    await LoginHistory.create({ userId, ipAddress, device });
  } catch (error) {
    // never let a logging failure break login itself
    console.error('Failed to record login history:', error.message);
  }
};

module.exports = { recordLogin, summarizeDevice };

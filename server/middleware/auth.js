const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    if (req.user.status === 'banned') {
      return res.status(403).json({ message: 'This account has been banned' });
    }
    if (req.user.status === 'suspended') {
      return res.status(403).json({ message: 'This account is suspended. Contact support for help.' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid token' });
  }
};

const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ message: 'Please verify your email to continue' });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { protect, requireVerified, requireAdmin };

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'localmate_secret_jwt_key_2026_very_secure_and_long_enough_for_hmac_sha256';

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid format' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findOne({ email: decoded.sub || decoded.email });
    if (!user) {
      return res.status(401).json({ message: 'User not found for this token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token: ' + error.message });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findOne({ email: decoded.sub || decoded.email });
      if (user) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore error for optional authentication
  }
  next();
};

module.exports = {
  verifyToken,
  optionalAuth,
  JWT_SECRET,
};

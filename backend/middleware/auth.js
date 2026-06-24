// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    console.error('❌ ERROR: JWT_SECRET not properly configured in environment variables');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be configured');
    }
  }
  return secret || 'djera_dev_secret_key_not_for_production_12345678';
};

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, getJWTSecret());
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired. Please login again.' });
    }
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = auth;
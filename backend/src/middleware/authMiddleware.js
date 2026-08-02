const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verifies the Bearer token and attaches req.user
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      // Instant revocation check: if an admin has signed this user out
      // since this token was issued, tokenVersion on the token won't
      // match the current value on the user — reject immediately even
      // though the token itself is still cryptographically valid.
      const tokenVersion = decoded.tokenVersion ?? 0;
      if (tokenVersion !== (req.user.tokenVersion ?? 0)) {
        return res.status(401).json({
          message: 'Session revoked. Please log in again.',
        });
      }

      return next();
    } catch (err) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Restricts a route to admin-only access. Must run AFTER `protect`,
// since it relies on req.user being set.
exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};
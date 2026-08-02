const jwt = require('jsonwebtoken');

// tokenVersion defaults to 0 for backward compatibility with any call
// site that doesn't pass one, but every auth flow should pass the
// user's current tokenVersion so revocation works correctly.
const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;
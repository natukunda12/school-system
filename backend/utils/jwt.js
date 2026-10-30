const { HttpError } = require('./http');

function requireJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new HttpError(
      503,
      'Authentication is unavailable because JWT_SECRET is not configured on the server. Set JWT_SECRET in the backend host environment and restart the API.'
    );
  }
  return secret;
}

module.exports = { requireJwtSecret };

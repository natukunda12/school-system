const jwt = require('jsonwebtoken');
const { requireJwtSecret } = require('../utils/jwt');

exports.authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in' });
  let secret;
  try {
    secret = requireJwtSecret();
  } catch (error) {
    return next(error);
  }
  try {
    req.user = jwt.verify(token, secret);
    next();
  } catch {
    res.status(401).json({ message: 'Your session expired. Log in again' });
  }
};

exports.authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ message: 'You are not allowed to do this' });

exports.ADMINS = ['super_admin', 'registrar'];
exports.STAFF = ['super_admin', 'registrar', 'staff', 'dean_of_discipline', 'secretary'];
exports.DEAN = ['super_admin', 'dean_of_discipline'];
exports.SECRETARY = ['super_admin', 'secretary'];

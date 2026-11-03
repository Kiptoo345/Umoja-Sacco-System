// Authentication (who are you?) and role-based access (what may you do?).
// Role names are exactly those in the Role table: Admin, System Administrator, Staff, Loan Officer, Accountant, Member.
const jwt = require('jsonwebtoken');
const { pool } = require('./db');
const { wrap } = require('./util');

const authenticate = wrap(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Login required' });
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); }
  catch { return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' }); }
  // Re-check the account every request so deactivating a user takes effect immediately.
  const [rows] = await pool.execute('SELECT is_active FROM User WHERE user_id=?', [payload.userId]);
  if (!rows.length || !rows[0].is_active) return res.status(401).json({ error: 'Account is inactive' });
  req.user = payload;
  next();
});

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'You do not have permission to do this' });
  next();
};
module.exports = { authenticate, requireRole };

// Login, logout, change password, forgot/reset password.
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../db');
const { audit } = require('../audit');
const { authenticate } = require('../auth');
const { HttpError, wrap, password } = require('../util');
const router = express.Router();

router.post('/login', wrap(async (req, res) => {
  const { username, password: pw } = req.body || {};
  if (typeof username !== 'string' || typeof pw !== 'string')
    throw new HttpError(400, 'Username and password are required');
  const name = username.trim();
  const [rows] = await pool.execute(
    `SELECT u.user_id, u.username, u.password_hash, u.is_active, r.role_name
       FROM User u JOIN Role r ON r.role_id = u.role_id WHERE u.username = ? OR u.email = ?`, [name, name]);
  const u = rows[0];
  const ok = u && (await bcrypt.compare(pw, u.password_hash));
  if (!ok || !u.is_active) {
    await audit(pool, u ? u.user_id : null, 'LOGIN_FAILED', `username=${name.slice(0, 50)}`, req.ip);
    throw new HttpError(401, 'Invalid username or password');
  }
  const [s] = await pool.execute("SELECT staff_id, CONCAT(first_name,' ',last_name) AS full_name FROM Staff WHERE user_id=?", [u.user_id]);
  const [m] = await pool.execute("SELECT member_id, CONCAT(first_name,' ',last_name) AS full_name FROM Member WHERE user_id=?", [u.user_id]);
  const staffId = s[0] ? s[0].staff_id : null;
  const memberId = m[0] ? m[0].member_id : null;
  const fullName = (s[0] || m[0] || {}).full_name || u.username;
  const token = jwt.sign({ userId: u.user_id, role: u.role_name, staffId, memberId }, process.env.JWT_SECRET, { expiresIn: '8h' });
  await audit(pool, u.user_id, 'LOGIN', u.role_name, req.ip);
  res.json({ token, user: { userId: u.user_id, username: u.username, role: u.role_name, fullName, staffId, memberId } });
}));

// The client discards the token; this call records the logout in the audit trail.
router.post('/logout', authenticate, wrap(async (req, res) => {
  await audit(pool, req.user.userId, 'LOGOUT', req.user.role, req.ip);
  res.json({ message: 'Logged out' });
}));

router.post('/change-password', authenticate, wrap(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  password(newPassword, 'newPassword');
  const [rows] = await pool.execute('SELECT password_hash FROM User WHERE user_id=?', [req.user.userId]);
  if (typeof currentPassword !== 'string' || !(await bcrypt.compare(currentPassword, rows[0].password_hash)))
    throw new HttpError(401, 'Current password is incorrect');
  await pool.execute('UPDATE User SET password_hash=? WHERE user_id=?', [await bcrypt.hash(newPassword, 10), req.user.userId]);
  await audit(pool, req.user.userId, 'PASSWORD_CHANGED', '', req.ip);
  res.json({ message: 'Password changed' });
}));

const needsExtras = (e) => { if (e.code === 'ER_NO_SUCH_TABLE') throw new HttpError(503, 'Password reset is not set up yet (run npm run setup-db)'); throw e; };

// No email service yet: in development the token is returned in the response.
router.post('/forgot-password', wrap(async (req, res) => {
  const { username } = req.body || {};
  const reply = { message: 'If that account exists, a reset token has been issued.' };
  if (typeof username === 'string') {
    const name = username.trim();
    const [rows] = await pool.execute('SELECT user_id FROM User WHERE (username=? OR email=?) AND is_active=1', [name, name]);
    if (rows.length) {
      const token = crypto.randomBytes(32).toString('hex');
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      await pool.execute('INSERT INTO PasswordReset (user_id, token_hash, expires_at) VALUES (?,?,DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
        [rows[0].user_id, hash]).catch(needsExtras);
      await audit(pool, rows[0].user_id, 'PASSWORD_RESET_REQUESTED', '', req.ip);
      if (process.env.RETURN_RESET_TOKEN === 'true') reply.resetToken = token;
    }
  }
  res.json(reply);
}));

router.post('/reset-password', wrap(async (req, res) => {
  const { token, newPassword } = req.body || {};
  password(newPassword, 'newPassword');
  if (typeof token !== 'string') throw new HttpError(400, 'token is required');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const [rows] = await pool.execute('SELECT reset_id, user_id FROM PasswordReset WHERE token_hash=? AND used=0 AND expires_at > NOW()', [hash]).catch(needsExtras);
  if (!rows.length) throw new HttpError(400, 'Reset token is invalid or has expired');
  await pool.execute('UPDATE User SET password_hash=? WHERE user_id=?', [await bcrypt.hash(newPassword, 10), rows[0].user_id]);
  await pool.execute('UPDATE PasswordReset SET used=1 WHERE reset_id=?', [rows[0].reset_id]);
  await audit(pool, rows[0].user_id, 'PASSWORD_RESET', '', req.ip);
  res.json({ message: 'Password updated. You can now log in.' });
}));

module.exports = router;

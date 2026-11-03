// Admin panel endpoints: employees (Admin), user accounts / audit log (System Administrator), reports.
const express = require('express');
const bcrypt = require('bcryptjs');
const { pool, withTransaction } = require('../db');
const { audit } = require('../audit');
const { authenticate, requireRole } = require('../auth');
const { HttpError, wrap, text, password } = require('../util');
const router = express.Router();
router.use(authenticate);

const EMPLOYEE_ROLES = ['Staff', 'Loan Officer', 'Accountant'];

router.get('/roles', requireRole('Admin', 'System Administrator'), wrap(async (req, res) => {
  const [rows] = await pool.execute('SELECT role_id, role_name, description FROM Role ORDER BY role_id');
  res.json(rows);
}));

// ---- Admin: employees ----
router.get('/employees', requireRole('Admin'), wrap(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT s.staff_id, u.username, u.email, s.first_name, s.last_name, s.position, s.phone_number, r.role_name,
            IF(u.is_active=1,'Active','Inactive') AS status
       FROM Staff s JOIN User u ON u.user_id = s.user_id JOIN Role r ON r.role_id = u.role_id ORDER BY s.staff_id`);
  res.json(rows);
}));

router.post('/employees', requireRole('Admin'), wrap(async (req, res) => {
  const b = req.body || {};
  const username = text(b.username, 'username', { min: 3, max: 50 });
  const mail = text(b.email, 'email', { min: 5, max: 100 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) throw new HttpError(400, 'email is not a valid address');
  const firstName = text(b.firstName, 'firstName', { max: 50 });
  const lastName = text(b.lastName, 'lastName', { max: 50 });
  const position = text(b.position, 'position', { max: 100 });
  const phone = text(b.phone, 'phone', { min: 7, max: 20 });
  const pw = password(b.password);
  if (!EMPLOYEE_ROLES.includes(b.role)) throw new HttpError(400, `role must be one of ${EMPLOYEE_ROLES.join(', ')}`);
  const hash = await bcrypt.hash(pw, 10);
  const out = await withTransaction(async (conn) => {
    const [r] = await conn.execute('SELECT role_id FROM Role WHERE role_name=?', [b.role]);
    const [u] = await conn.execute('INSERT INTO User (username, password_hash, email, role_id) VALUES (?,?,?,?)', [username, hash, mail, r[0].role_id]);
    const [s] = await conn.execute('INSERT INTO Staff (user_id, first_name, last_name, position, phone_number) VALUES (?,?,?,?,?)', [u.insertId, firstName, lastName, position, phone]);
    await audit(conn, req.user.userId, 'EMPLOYEE_CREATED', `${username} as ${b.role}`, req.ip);
    return { staffId: s.insertId, username, role: b.role };
  });
  res.status(201).json(out);
}));

// ---- System Administrator: user accounts, permissions, security ----
router.get('/users', requireRole('System Administrator'), wrap(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT u.user_id, u.username, u.email, r.role_name, IF(u.is_active=1,'Active','Inactive') AS status, u.created_at
       FROM User u JOIN Role r ON r.role_id = u.role_id ORDER BY u.user_id`);
  res.json(rows);
}));

router.patch('/users/:id', requireRole('System Administrator'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  if (id === req.user.userId) throw new HttpError(400, 'You cannot change your own role or status');
  if (b.status !== undefined && !['Active', 'Inactive'].includes(b.status)) throw new HttpError(400, 'status must be Active or Inactive');
  await withTransaction(async (conn) => {
    const [u] = await conn.execute('SELECT user_id FROM User WHERE user_id=?', [id]);
    if (!u.length) throw new HttpError(404, 'User not found');
    if (b.role !== undefined) {
      const [r] = await conn.execute('SELECT role_id FROM Role WHERE role_name=?', [b.role]);
      if (!r.length) throw new HttpError(400, 'Unknown role');
      await conn.execute('UPDATE User SET role_id=? WHERE user_id=?', [r[0].role_id, id]);
    }
    if (b.status !== undefined) await conn.execute('UPDATE User SET is_active=? WHERE user_id=?', [b.status === 'Active' ? 1 : 0, id]);
    await audit(conn, req.user.userId, 'USER_UPDATED', `user_id=${id} role=${b.role ?? '-'} status=${b.status ?? '-'}`, req.ip);
  });
  res.json({ message: 'User updated' });
}));

router.post('/users/:id/reset-password', requireRole('System Administrator'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const pw = password((req.body || {}).newPassword, 'newPassword');
  const [u] = await pool.execute('SELECT user_id FROM User WHERE user_id=?', [id]);
  if (!u.length) throw new HttpError(404, 'User not found');
  await pool.execute('UPDATE User SET password_hash=? WHERE user_id=?', [await bcrypt.hash(pw, 10), id]);
  await audit(pool, req.user.userId, 'ADMIN_PASSWORD_RESET', `user_id=${id}`, req.ip);
  res.json({ message: 'Password reset' });
}));

router.get('/audit-logs', requireRole('System Administrator'), wrap(async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
  try {
    const [rows] = await pool.query(
      `SELECT a.log_id, u.username, a.action, a.details, a.ip_address, a.created_at
         FROM AuditLog a LEFT JOIN User u ON u.user_id = a.user_id ORDER BY a.log_id DESC LIMIT ?`, [limit]);
    res.json(rows);
  } catch (e) {
    if (e.code === 'ER_NO_SUCH_TABLE') throw new HttpError(503, 'Audit log is not set up yet (run npm run setup-db)');
    throw e;
  }
}));

// ---- Reports ----
router.get('/reports/summary', requireRole('Accountant', 'Admin'), wrap(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT (SELECT COUNT(*) FROM Member m JOIN User u ON u.user_id=m.user_id WHERE u.is_active=1) AS active_members,
            (SELECT COALESCE(SUM(savings_balance),0) FROM Member) AS total_savings,
            (SELECT COALESCE(SUM(amount),0) FROM Deposit WHERE status='Verified') AS total_verified_deposits,
            (SELECT COUNT(*) FROM Deposit WHERE status='Pending Verification') AS deposits_awaiting_verification,
            (SELECT COUNT(*) FROM Loan WHERE status='Active') AS active_loans,
            (SELECT COALESCE(SUM(outstanding_balance),0) FROM Loan WHERE status='Active') AS outstanding_loans`);
  res.json(rows[0]);
}));

module.exports = router;

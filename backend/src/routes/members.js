// FR1: staff register members (uses the teammate's RegisterNewMember procedure, which generates the membership number).
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool, withTransaction } = require('../db');
const { audit } = require('../audit');
const { authenticate, requireRole } = require('../auth');
const { HttpError, wrap, text } = require('../util');
const router = express.Router();
router.use(authenticate);

const MEMBER_SELECT = `SELECT m.member_id, m.membership_number, m.first_name, m.last_name,
       CONCAT(m.first_name,' ',m.last_name) AS full_name, u.email, m.phone_number, m.address,
       m.savings_balance, m.registration_date, IF(u.is_active=1,'Active','Inactive') AS status
  FROM Member m JOIN User u ON u.user_id = m.user_id`;
const email = (v) => {
  const e = text(v, 'email', { min: 5, max: 100 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) throw new HttpError(400, 'email is not a valid address');
  return e;
};

router.post('/', requireRole('Staff'), wrap(async (req, res) => {
  const b = req.body || {};
  const firstName = text(b.firstName, 'firstName', { min: 1, max: 50 });
  const lastName = text(b.lastName, 'lastName', { min: 1, max: 50 });
  const mail = email(b.email);
  const phone = text(b.phone, 'phone', { min: 7, max: 20 });
  const address = typeof b.address === 'string' && b.address.trim() ? b.address.trim().slice(0, 500) : null;
  const username = b.username ? text(b.username, 'username', { min: 3, max: 50 }) : mail;   // default: login with email
  const tempPassword = crypto.randomBytes(5).toString('hex');
  const hash = await bcrypt.hash(tempPassword, 10);

  const result = await withTransaction(async (conn) => {
    const [rs] = await conn.execute('CALL RegisterNewMember(?,?,?,?,?,?,?)', [username, hash, mail, firstName, lastName, phone, address]);
    const row = (rs.find(Array.isArray) || [])[0];
    if (!row) throw new Error('RegisterNewMember returned no result');
    await audit(conn, req.user.userId, 'MEMBER_REGISTERED', `${row.membership_number} ${firstName} ${lastName}`, req.ip);
    return { userId: row.user_id, membershipNumber: row.membership_number };
  });
  res.status(201).json({ ...result, username, temporaryPassword: tempPassword,
    message: 'Give the member their username and this temporary password.' });
}));

// Member dashboard: uses the teammate's View_MemberDashboard (savings + total outstanding loan balance).
router.get('/me', requireRole('Member'), wrap(async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM View_MemberDashboard WHERE member_id=?', [req.user.memberId]);
  res.json(rows[0]);
}));

router.get('/', requireRole('Staff', 'Admin', 'Accountant', 'Loan Officer'), wrap(async (req, res) => {
  const s = typeof req.query.search === 'string' ? `%${req.query.search.trim()}%` : '%';
  const [rows] = await pool.execute(
    `${MEMBER_SELECT} WHERE m.membership_number LIKE ? OR CONCAT(m.first_name,' ',m.last_name) LIKE ? ORDER BY m.member_id DESC LIMIT 200`, [s, s]);
  res.json(rows);
}));

router.get('/:id', requireRole('Staff', 'Admin', 'Accountant', 'Loan Officer'), wrap(async (req, res) => {
  const [rows] = await pool.execute(`${MEMBER_SELECT} WHERE m.member_id=?`, [Number(req.params.id)]);
  if (!rows.length) throw new HttpError(404, 'Member not found');
  res.json(rows[0]);
}));

router.put('/:id', requireRole('Admin'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const opt = (v, f, o) => (v === undefined ? null : text(v, f, o));
  const firstName = opt(b.firstName, 'firstName', { max: 50 });
  const lastName = opt(b.lastName, 'lastName', { max: 50 });
  const phone = opt(b.phone, 'phone', { min: 7, max: 20 });
  const address = opt(b.address, 'address', { max: 500 });
  const status = b.status === undefined ? null : b.status;
  if (status !== null && !['Active', 'Inactive'].includes(status)) throw new HttpError(400, 'status must be Active or Inactive');
  await withTransaction(async (conn) => {
    const [rows] = await conn.execute('SELECT user_id FROM Member WHERE member_id=?', [id]);
    if (!rows.length) throw new HttpError(404, 'Member not found');
    await conn.execute('UPDATE Member SET first_name=COALESCE(?,first_name), last_name=COALESCE(?,last_name), phone_number=COALESCE(?,phone_number), address=COALESCE(?,address) WHERE member_id=?',
      [firstName, lastName, phone, address, id]);
    if (status) await conn.execute('UPDATE User SET is_active=? WHERE user_id=?', [status === 'Active' ? 1 : 0, rows[0].user_id]);
    await audit(conn, req.user.userId, 'MEMBER_UPDATED', `member_id=${id}`, req.ip);
  });
  res.json({ message: 'Member updated' });
}));

module.exports = router;

// FR2: staff record a deposit (Pending Verification). The accountant verifies it; the teammate's
// AfterDepositVerified trigger then adds the amount to the member's savings_balance.
const express = require('express');
const { pool, withTransaction } = require('../db');
const { audit } = require('../audit');
const { authenticate, requireRole } = require('../auth');
const { HttpError, wrap, text, amount } = require('../util');
const router = express.Router();
router.use(authenticate);

router.post('/', requireRole('Staff'), wrap(async (req, res) => {
  const b = req.body || {};
  const number = text(b.membershipNumber, 'membershipNumber', { min: 3, max: 20 });
  const amt = amount(b.amount);
  const result = await withTransaction(async (conn) => {
    const [m] = await conn.execute(
      'SELECT m.member_id, u.is_active FROM Member m JOIN User u ON u.user_id = m.user_id WHERE m.membership_number=? FOR UPDATE', [number]);
    if (!m.length) throw new HttpError(404, 'Member not found');
    if (!m[0].is_active) throw new HttpError(400, 'Member account is inactive');
    const [d] = await conn.execute('INSERT INTO Deposit (member_id, amount, recorded_by_staff_id) VALUES (?,?,?)', [m[0].member_id, amt, req.user.staffId]);
    await audit(conn, req.user.userId, 'DEPOSIT_RECORDED', `${number} amount=${amt}`, req.ip);
    return { depositId: d.insertId, membershipNumber: number, amount: amt, status: 'Pending Verification' };
  });
  res.status(201).json({ ...result, message: 'Deposit recorded. Savings update once the accountant verifies it.' });
}));

router.get('/', requireRole('Staff', 'Accountant', 'Admin'), wrap(async (req, res) => {
  const status = ['Pending Verification', 'Verified', 'Rejected'].includes(req.query.status) ? req.query.status : null;
  const [rows] = await pool.execute(
    `SELECT d.deposit_id, m.membership_number, CONCAT(m.first_name,' ',m.last_name) AS full_name, d.amount, d.deposit_date, d.status
       FROM Deposit d JOIN Member m ON m.member_id = d.member_id
      WHERE (? IS NULL OR d.status = ?) ORDER BY d.deposit_id DESC LIMIT 200`, [status, status]);
  res.json(rows);
}));

// Accountant: the bank side. Verify (creates a Credit BankTransaction) or reject.
router.patch('/:id/verify', requireRole('Accountant'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  if (!['Verify', 'Reject'].includes(b.decision)) throw new HttpError(400, "decision must be 'Verify' or 'Reject'");
  const ref = b.decision === 'Verify' ? text(b.bankReference, 'bankReference', { min: 3, max: 50 }) : null;

  const result = await withTransaction(async (conn) => {
    const [d] = await conn.execute('SELECT deposit_id, member_id, amount, status FROM Deposit WHERE deposit_id=? FOR UPDATE', [id]);
    if (!d.length) throw new HttpError(404, 'Deposit not found');
    if (d[0].status !== 'Pending Verification') throw new HttpError(409, `Deposit is already ${d[0].status}`);
    if (b.decision === 'Reject') {
      await conn.execute("UPDATE Deposit SET status='Rejected', verified_by_accountant_id=? WHERE deposit_id=?", [req.user.staffId, id]);
      await audit(conn, req.user.userId, 'DEPOSIT_REJECTED', `deposit_id=${id}`, req.ip);
      return { depositId: id, status: 'Rejected' };
    }
    await conn.execute("UPDATE Deposit SET status='Verified', verified_by_accountant_id=? WHERE deposit_id=?", [req.user.staffId, id]); // trigger adds to savings
    await conn.execute("INSERT INTO BankTransaction (accountant_id, transaction_type, amount, reference_number, description) VALUES (?,'Credit',?,?,?)",
      [req.user.staffId, d[0].amount, ref, `Deposit #${id}`]);
    const [bal] = await conn.execute('SELECT savings_balance FROM Member WHERE member_id=?', [d[0].member_id]);
    await audit(conn, req.user.userId, 'DEPOSIT_VERIFIED', `deposit_id=${id} ref=${ref}`, req.ip);
    return { depositId: id, status: 'Verified', amount: d[0].amount, memberSavingsBalance: bal[0].savings_balance };
  });
  res.json(result);
}));

module.exports = router;

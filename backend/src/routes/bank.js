// Accountant: the SACCO's bank ledger. Deposit verification and loan repayments add Credit entries automatically;
// this endpoint is for any other entry (e.g. a Debit when a loan is paid out to the member).
const express = require('express');
const { pool } = require('../db');
const { audit } = require('../audit');
const { authenticate, requireRole } = require('../auth');
const { HttpError, wrap, text, amount } = require('../util');
const router = express.Router();
router.use(authenticate, requireRole('Accountant'));

router.post('/', wrap(async (req, res) => {
  const b = req.body || {};
  if (!['Credit', 'Debit'].includes(b.type)) throw new HttpError(400, "type must be 'Credit' or 'Debit'");
  const amt = amount(b.amount);
  const ref = text(b.referenceNumber, 'referenceNumber', { min: 3, max: 50 });
  const description = typeof b.description === 'string' ? b.description.trim().slice(0, 1000) : null;
  const [r] = await pool.execute('INSERT INTO BankTransaction (accountant_id, transaction_type, amount, reference_number, description) VALUES (?,?,?,?,?)',
    [req.user.staffId, b.type, amt, ref, description]);
  await audit(pool, req.user.userId, 'BANK_TRANSACTION', `${b.type} ${amt} ref=${ref}`, req.ip);
  res.status(201).json({ transactionId: r.insertId, type: b.type, amount: amt, referenceNumber: ref });
}));

router.get('/', wrap(async (req, res) => {
  const type = ['Credit', 'Debit'].includes(req.query.type) ? req.query.type : null;
  const [rows] = await pool.execute(
    `SELECT transaction_id, accountant_id, transaction_type, amount, transaction_date, reference_number, description
       FROM BankTransaction WHERE (? IS NULL OR transaction_type = ?) ORDER BY transaction_id DESC LIMIT 200`, [type, type]);
  res.json(rows);
}));

module.exports = router;

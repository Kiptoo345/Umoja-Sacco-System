// FR3-FR5: loan applications, loan officer decision (uses the teammate's ApproveLoanApplication procedure),
// repayments (the AfterLoanRepayment trigger reduces the balance and closes the loan) and outstanding balance.
const express = require('express');
const { pool, withTransaction } = require('../db');
const { audit } = require('../audit');
const { authenticate, requireRole } = require('../auth');
const { HttpError, wrap, text, amount } = require('../util');
const router = express.Router();
router.use(authenticate);

const LOAN_COLS = 'l.loan_id, l.application_id, l.principal_amount, l.interest_rate, l.total_amount, l.outstanding_balance, l.disbursement_date, l.status';

// Member submits a loan application.
router.post('/applications', requireRole('Member'), wrap(async (req, res) => {
  const b = req.body || {};
  const amt = amount(b.amountRequested, 'amountRequested');
  const purpose = text(b.purpose, 'purpose', { min: 3, max: 1000 });
  const result = await withTransaction(async (conn) => {
    await conn.execute('SELECT member_id FROM Member WHERE member_id=? FOR UPDATE', [req.user.memberId]);
    // Business rule: one open loan at a time (no pending application and no active loan).
    const [c] = await conn.execute(
      `SELECT (SELECT COUNT(*) FROM LoanApplication WHERE member_id=? AND status='Pending') AS pending,
              (SELECT COUNT(*) FROM Loan WHERE member_id=? AND status='Active') AS active_loans`, [req.user.memberId, req.user.memberId]);
    if (c[0].pending > 0) throw new HttpError(409, 'You already have a loan application awaiting review');
    if (c[0].active_loans > 0) throw new HttpError(409, 'You still have an active loan');
    const [a] = await conn.execute('INSERT INTO LoanApplication (member_id, amount_requested, purpose) VALUES (?,?,?)', [req.user.memberId, amt, purpose]);
    await audit(conn, req.user.userId, 'LOAN_APPLIED', `application_id=${a.insertId} amount=${amt}`, req.ip);
    return { applicationId: a.insertId, status: 'Pending' };
  });
  res.status(201).json(result);
}));

// Loan officer sees all applications; a member sees only their own.
router.get('/applications', requireRole('Loan Officer', 'Member'), wrap(async (req, res) => {
  const status = ['Pending', 'Approved', 'Rejected'].includes(req.query.status) ? req.query.status : null;
  const memberId = req.user.role === 'Member' ? req.user.memberId : null;
  const [rows] = await pool.execute(
    `SELECT a.application_id, m.membership_number, CONCAT(m.first_name,' ',m.last_name) AS full_name, m.savings_balance,
            a.amount_requested, a.purpose, a.application_date, a.status, a.review_date, a.comments
       FROM LoanApplication a JOIN Member m ON m.member_id = a.member_id
      WHERE (? IS NULL OR a.member_id = ?) AND (? IS NULL OR a.status = ?)
      ORDER BY a.application_id DESC LIMIT 200`, [memberId, memberId, status, status]);
  res.json(rows);
}));

// Loan officer approves or rejects. Approval calls ApproveLoanApplication, which creates the Active loan with interest.
router.patch('/applications/:id/decision', requireRole('Loan Officer'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  if (!['Approve', 'Reject'].includes(b.decision)) throw new HttpError(400, "decision must be 'Approve' or 'Reject'");
  const comments = b.decision === 'Reject' ? text(b.comments, 'comments', { min: 3, max: 1000 })
                                           : (typeof b.comments === 'string' && b.comments.trim() ? b.comments.trim().slice(0, 1000) : null);
  const rate = Number(process.env.INTEREST_RATE || 10);

  const result = await withTransaction(async (conn) => {
    const [a] = await conn.execute('SELECT application_id, status FROM LoanApplication WHERE application_id=? FOR UPDATE', [id]);
    if (!a.length) throw new HttpError(404, 'Application not found');
    if (a[0].status !== 'Pending') throw new HttpError(409, `Application already ${a[0].status.toLowerCase()}`);
    let loan = null;
    if (b.decision === 'Reject') {
      await conn.execute("UPDATE LoanApplication SET status='Rejected', reviewed_by_staff_id=?, review_date=CURRENT_TIMESTAMP, comments=? WHERE application_id=?",
        [req.user.staffId, comments, id]);
    } else {
      await conn.execute('CALL ApproveLoanApplication(?,?,?)', [id, req.user.staffId, rate]);
      if (comments) await conn.execute('UPDATE LoanApplication SET comments=? WHERE application_id=?', [comments, id]);
      const [l] = await conn.execute(`SELECT ${LOAN_COLS} FROM Loan l WHERE l.application_id=?`, [id]);
      if (!l.length) throw new Error('ApproveLoanApplication did not create a loan');
      loan = l[0];
    }
    const status = b.decision === 'Approve' ? 'Approved' : 'Rejected';
    await audit(conn, req.user.userId, `LOAN_${status.toUpperCase()}`, `application_id=${id}`, req.ip);
    return { applicationId: id, status, loan };
  });
  res.json(result);
}));

// FR5: member views loans with the outstanding balance.
router.get('/me', requireRole('Member'), wrap(async (req, res) => {
  const [rows] = await pool.execute(`SELECT ${LOAN_COLS} FROM Loan l WHERE l.member_id=? ORDER BY l.loan_id DESC`, [req.user.memberId]);
  res.json(rows);
}));

router.get('/', requireRole('Accountant', 'Loan Officer', 'Admin'), wrap(async (req, res) => {
  const status = ['Active', 'Closed', 'Defaulted'].includes(req.query.status) ? req.query.status : null;
  const [rows] = await pool.execute(
    `SELECT ${LOAN_COLS}, m.membership_number, CONCAT(m.first_name,' ',m.last_name) AS full_name
       FROM Loan l JOIN Member m ON m.member_id = l.member_id
      WHERE (? IS NULL OR l.status = ?) ORDER BY l.loan_id DESC LIMIT 200`, [status, status]);
  res.json(rows);
}));

// Accountant records a repayment and the matching Credit bank transaction in ONE transaction.
router.post('/:id/repayments', requireRole('Accountant'), wrap(async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const amt = amount(b.amount);
  const receipt = text(b.receiptNumber, 'receiptNumber', { min: 3, max: 50 });
  const method = text(b.paymentMethod, 'paymentMethod', { min: 3, max: 50 });

  const result = await withTransaction(async (conn) => {
    const [l] = await conn.execute('SELECT loan_id, outstanding_balance, status FROM Loan WHERE loan_id=? FOR UPDATE', [id]);
    if (!l.length) throw new HttpError(404, 'Loan not found');
    if (l[0].status !== 'Active') throw new HttpError(409, `Loan is ${l[0].status}; repayments need an Active loan`);
    if (amt > l[0].outstanding_balance) throw new HttpError(400, `Amount exceeds outstanding balance of ${l[0].outstanding_balance}`);
    const [r] = await conn.execute('INSERT INTO LoanRepayment (loan_id, amount_paid, payment_method, receipt_number) VALUES (?,?,?,?)', [id, amt, method, receipt]); // trigger updates the loan
    await conn.execute("INSERT INTO BankTransaction (accountant_id, transaction_type, amount, reference_number, description) VALUES (?,'Credit',?,?,?)",
      [req.user.staffId, amt, receipt, `Loan #${id} repayment`]);
    const [after] = await conn.execute('SELECT outstanding_balance, status FROM Loan WHERE loan_id=?', [id]);
    await audit(conn, req.user.userId, 'LOAN_REPAYMENT', `loan_id=${id} amount=${amt} receipt=${receipt}`, req.ip);
    return { repaymentId: r.insertId, loanId: id, amountPaid: amt, outstandingBalance: after[0].outstanding_balance, loanStatus: after[0].status };
  });
  res.status(201).json(result);
}));

module.exports = router;

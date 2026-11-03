// End-to-end smoke test. Start the server first (npm start), seed the database (npm run seed), then: npm test
const BASE = process.env.API_URL || 'http://localhost:3000/api';
let passed = 0, failed = 0;
const call = async (method, path, token, body) => {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await r.json(); } catch {}
  return { status: r.status, data };
};
const check = (name, cond, extra = '') => { cond ? passed++ : failed++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : '  -> ' + extra}`); };
const login = async (u, p = 'Password123!') => (await call('POST', '/auth/login', null, { username: u, password: p })).data?.token;
const run = Date.now().toString().slice(-6);

const staff = await login('staff1'), officer = await login('officer1'), acct = await login('accountant1');
const admin = await login('admin'), sysadmin = await login('sysadmin');
check('all 5 employee roles can log in', staff && officer && acct && admin && sysadmin);
check('wrong password rejected (401)', (await call('POST', '/auth/login', null, { username: 'staff1', password: 'nope' })).status === 401);
check('no token rejected (401)', (await call('GET', '/members')).status === 401);

// FR1 register member (teammate's RegisterNewMember procedure)
const email = `t${run}@example.com`;
let r = await call('POST', '/members', staff, { firstName: 'Test', lastName: 'Member', email, phone: '0712345678', address: 'Nairobi' });
check('FR1 staff registers member, number generated', r.status === 201 && /^SACCO-\d{4}-\d{4}$/.test(r.data.membershipNumber), JSON.stringify(r));
const { membershipNumber, temporaryPassword, username } = r.data;
check('duplicate email rejected (409)', (await call('POST', '/members', staff, { firstName: 'Dup', lastName: 'M', email, phone: '0712345678' })).status === 409);
check('loan officer cannot register member (403)', (await call('POST', '/members', officer, { firstName: 'X', lastName: 'Y', email: `x${run}@example.com`, phone: '0712345678' })).status === 403);
const member = await login(username, temporaryPassword);
check('member can log in with temporary password', !!member);

// FR2 deposits: staff record, accountant verifies, trigger updates savings
r = await call('POST', '/deposits', staff, { membershipNumber, amount: 10000 });
check('FR2 deposit recorded as Pending Verification', r.status === 201 && r.data.status === 'Pending Verification', JSON.stringify(r));
const depositId = r.data.depositId;
check('negative deposit rejected (400)', (await call('POST', '/deposits', staff, { membershipNumber, amount: -5 })).status === 400);
check('unknown member deposit rejected (404)', (await call('POST', '/deposits', staff, { membershipNumber: 'SACCO-0000-0000', amount: 5 })).status === 404);
check('member cannot record deposit (403)', (await call('POST', '/deposits', member, { membershipNumber, amount: 5 })).status === 403);
r = await call('GET', '/members/me', member);
check('savings still 0 before verification', r.status === 200 && r.data.savings_balance === 0, JSON.stringify(r));
check('verify without bank reference rejected (400)', (await call('PATCH', `/deposits/${depositId}/verify`, acct, { decision: 'Verify' })).status === 400);
check('staff cannot verify (403)', (await call('PATCH', `/deposits/${depositId}/verify`, staff, { decision: 'Verify', bankReference: 'X' + run })).status === 403);
r = await call('PATCH', `/deposits/${depositId}/verify`, acct, { decision: 'Verify', bankReference: 'BANK' + run });
check('accountant verifies; trigger adds 10000 to savings', r.status === 200 && r.data.memberSavingsBalance === 10000, JSON.stringify(r));
check('deposit cannot be verified twice (409, no double count)', (await call('PATCH', `/deposits/${depositId}/verify`, acct, { decision: 'Verify', bankReference: 'AGAIN' + run })).status === 409);
r = await call('GET', '/members/me', member);
check('FR3 member sees savings = 10000', r.data?.savings_balance === 10000, JSON.stringify(r));
r = await call('POST', '/deposits', staff, { membershipNumber, amount: 500 });
await call('PATCH', `/deposits/${r.data.depositId}/verify`, acct, { decision: 'Reject' });
r = await call('GET', '/members/me', member);
check('rejected deposit does not change savings', r.data?.savings_balance === 10000, JSON.stringify(r));

// Loan cycle (teammate's ApproveLoanApplication procedure)
r = await call('POST', '/loans/applications', member, { amountRequested: 50000, purpose: 'Business stock' });
check('FR3 member submits loan application', r.status === 201, JSON.stringify(r));
const appId = r.data.applicationId;
check('second open application blocked (409)', (await call('POST', '/loans/applications', member, { amountRequested: 1000, purpose: 'Other' })).status === 409);
check('member cannot approve (403)', (await call('PATCH', `/loans/applications/${appId}/decision`, member, { decision: 'Approve' })).status === 403);
check('reject without comments blocked (400)', (await call('PATCH', `/loans/applications/${appId}/decision`, officer, { decision: 'Reject' })).status === 400);
r = await call('PATCH', `/loans/applications/${appId}/decision`, officer, { decision: 'Approve' });
check('FR4 officer approves; loan Active, total 55000', r.status === 200 && r.data.loan?.total_amount === 55000 && r.data.loan.status === 'Active', JSON.stringify(r));
const loanId = r.data.loan.loan_id;
check('already-decided application blocked (409)', (await call('PATCH', `/loans/applications/${appId}/decision`, officer, { decision: 'Approve' })).status === 409);

// FR5 repayments (AfterLoanRepayment trigger) + all-or-nothing check
r = await call('POST', `/loans/${loanId}/repayments`, acct, { amount: 20000, paymentMethod: 'M-Pesa', receiptNumber: 'REC1' + run });
check('FR5 repay 20000 -> outstanding 35000', r.status === 201 && r.data.outstandingBalance === 35000, JSON.stringify(r));
r = await call('POST', `/loans/${loanId}/repayments`, acct, { amount: 5000, paymentMethod: 'M-Pesa', receiptNumber: 'BANK' + run });
check('clashing bank reference rejected (409)', r.status === 409, JSON.stringify(r));
r = await call('GET', '/loans/me', member);
check('ROLLBACK: failed repayment left balance at 35000', r.data?.[0]?.outstanding_balance === 35000, JSON.stringify(r));
check('overpayment rejected (400)', (await call('POST', `/loans/${loanId}/repayments`, acct, { amount: 99999, paymentMethod: 'Cash', receiptNumber: 'OVER' + run })).status === 400);
r = await call('GET', '/members/me', member);
check('dashboard shows outstanding loan balance 35000', r.data?.total_outstanding_loan_balance === 35000, JSON.stringify(r));
r = await call('POST', `/loans/${loanId}/repayments`, acct, { amount: 35000, paymentMethod: 'Cash', receiptNumber: 'REC2' + run });
check('final repayment -> Closed, balance 0', r.data?.outstandingBalance === 0 && r.data.loanStatus === 'Closed', JSON.stringify(r));

// Bank ledger
r = await call('POST', '/bank-transactions', acct, { type: 'Debit', amount: 1000, referenceNumber: 'DEB' + run, description: 'Office expense' });
check('accountant records a Debit bank transaction', r.status === 201, JSON.stringify(r));
check('duplicate bank reference rejected (409)', (await call('POST', '/bank-transactions', acct, { type: 'Debit', amount: 1, referenceNumber: 'DEB' + run })).status === 409);
check('staff cannot use bank ledger (403)', (await call('GET', '/bank-transactions', staff)).status === 403);

// Admin panel
r = await call('POST', '/employees', admin, { username: 'clerk' + run, email: `clerk${run}@umoja.test`, firstName: 'New', lastName: 'Clerk', position: 'Clerk', phone: '0711111111', password: 'Password123!', role: 'Staff' });
check('admin creates employee', r.status === 201, JSON.stringify(r));
check('admin cannot create System Administrator (400)', (await call('POST', '/employees', admin, { username: 'bad' + run, email: `bad${run}@umoja.test`, firstName: 'B', lastName: 'R', position: 'x', phone: '0711111111', password: 'Password123!', role: 'System Administrator' })).status === 400);
r = await call('GET', '/users', sysadmin);
check('sysadmin lists users', r.status === 200 && r.data.length >= 6);
const clerk = r.data.find(u => u.username === 'clerk' + run);
check('sysadmin deactivates a user', (await call('PATCH', `/users/${clerk.user_id}`, sysadmin, { status: 'Inactive' })).status === 200);
check('deactivated user cannot log in', !(await login('clerk' + run)));
r = await call('GET', '/audit-logs', sysadmin);
check('audit log has deposit and loan entries', r.status === 200 && r.data.some(x => x.action === 'DEPOSIT_VERIFIED') && r.data.some(x => x.action === 'LOAN_APPROVED'), JSON.stringify(r).slice(0, 200));
check('member cannot read audit log (403)', (await call('GET', '/audit-logs', member)).status === 403);
r = await call('GET', '/reports/summary', acct);
check('accountant report summary works', r.status === 200 && r.data.total_verified_deposits >= 10000, JSON.stringify(r));

// Forgot / reset password
r = await call('POST', '/auth/forgot-password', null, { username });
const rt = r.data?.resetToken;
check('forgot password issues token', !!rt, JSON.stringify(r));
check('reset password works', (await call('POST', '/auth/reset-password', null, { token: rt, newPassword: 'NewPass123!' })).status === 200);
check('reset token cannot be reused (400)', (await call('POST', '/auth/reset-password', null, { token: rt, newPassword: 'Another123!' })).status === 400);
check('login with new password works', !!(await login(username, 'NewPass123!')));
check('SQL injection attempt in login fails safely', (await call('POST', '/auth/login', null, { username: "' OR '1'='1", password: "' OR '1'='1" })).status === 401);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);

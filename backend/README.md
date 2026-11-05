# Umoja Community SACCO: Back-end API

Node.js + Express + MySQL. It works on top of the project's database files in the repo's `database/` folder: the
`RegisterNewMember` and `ApproveLoanApplication` procedures, the `AfterDepositVerified` and `AfterLoanRepayment`
triggers and the `View_MemberDashboard` view. The API never changes balances itself; the triggers do.

Security: bcrypt password hashing, JWT login, role check on every route, prepared statements everywhere,
audit log, all-or-nothing database transactions.

## Run it
1. Install Node.js 18+ and MySQL 8 (or MariaDB 10.5+).
2. In this `backend/` folder: `npm install`
3. Copy `.env.example` to `.env` and fill in `DB_USER`, `DB_PASSWORD`, `JWT_SECRET` (keep `DB_NAME=umoja_sacco_db`).
4. `npm run setup-db`  builds the database from the files in `database/` plus `database/extras.sql`
   (`node database/setup.js --reset` rebuilds from scratch and deletes data).
5. `npm run seed`  then  `npm start`  -> http://localhost:3000/api/health      (`npm test` runs 46 end-to-end checks)

Seeded logins (development only; password `Password123!`, change it): admin, sysadmin, staff1, officer1, accountant1.
Members log in with the username given at registration (default: their email) and the temporary password.
Send the token as `Authorization: Bearer <token>` on every request except login, forgot and reset password.

## Role names (exactly as in the Role table)
Admin, System Administrator, Staff, Loan Officer, Accountant, Member

## Endpoints
| Method and path | Role | What it does |
|---|---|---|
| POST /api/auth/login | anyone | log in (username or email) |
| POST /api/auth/logout | any logged in | records logout |
| POST /api/auth/change-password | any logged in | |
| POST /api/auth/forgot-password, /reset-password | anyone | |
| POST /api/members | Staff | register member (FR1); returns membership number + temporary password |
| GET /api/members, /api/members/:id | Staff, Admin, Accountant, Loan Officer | browse/search (?search=) |
| PUT /api/members/:id | Admin | edit or deactivate member |
| GET /api/members/me | Member | dashboard: savings + total outstanding loan balance (FR3, FR5) |
| POST /api/deposits | Staff | record deposit, status Pending Verification (FR2) |
| GET /api/deposits | Staff, Accountant | list (?status=Pending Verification) |
| PATCH /api/deposits/:id/verify | Accountant | `{decision:'Verify', bankReference}` or `{decision:'Reject'}`; verify adds to savings and logs a Credit |
| POST /api/loans/applications | Member | `{amountRequested, purpose}` (FR3) |
| GET /api/loans/applications | Loan Officer (all), Member (own) | list |
| PATCH /api/loans/applications/:id/decision | Loan Officer | `{decision:'Approve'}` or `{decision:'Reject', comments}` (FR4) |
| GET /api/loans/me | Member | own loans with outstanding balance (FR5) |
| GET /api/loans | Accountant, Loan Officer | list loans |
| POST /api/loans/:id/repayments | Accountant | `{amount, paymentMethod, receiptNumber}`; logs a Credit |
| GET, POST /api/bank-transactions | Accountant | ledger; POST `{type:'Credit'|'Debit', amount, referenceNumber, description}` |
| GET, POST /api/employees | Admin | `{username,email,firstName,lastName,position,phone,password,role}` |
| GET /api/users, PATCH /api/users/:id, POST /api/users/:id/reset-password | System Administrator | accounts, roles, status |
| GET /api/audit-logs | System Administrator | audit trail |
| GET /api/reports/summary | Accountant, Admin | totals |
| GET /api/roles | Admin, System Administrator | |

## Business rules
- A deposit changes savings only when the accountant verifies it (the database trigger does the update).
- Loan interest is flat, `INTEREST_RATE` in .env (default 10), passed to `ApproveLoanApplication`; the loan is Active immediately.
- A member may have only one open loan (no pending application and no active loan).
- Repayments reduce the balance and close the loan through the `AfterLoanRepayment` trigger.

## Additions beyond the base schema
`database/extras.sql` adds two tables:
- `AuditLog`: records logins, password changes and admin actions (viewed by the System Administrator).
- `PasswordReset`: stores hashed, single-use reset tokens that expire after 30 minutes.

## Password reset
There is no email service yet. When `RETURN_RESET_TOKEN=true` in `.env`, the reset token is returned in the API response for development. Turn this off in a real deployment.


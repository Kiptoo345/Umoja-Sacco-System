# Umoja Community SACCO Management System

> Together We Save, Together We Prosper.

A web-based information system for a savings and credit cooperative (SACCO). It lets staff register members and record deposits, accountants verify deposits and record repayments, loan officers decide on loan applications, members track their savings and loans, and administrators manage employees, accounts and the audit trail.

## Team

| Member | Responsibility |
|---|---|
| Victor | Front-end (React) |
| Mark Gituthu | Back-end API (Node/Express) |
| Michael Ochieng | Database and admin panel |

## Features

- **Staff:** register members (optional username, validated Kenyan phone number) and record counter deposits.
- **Accountant:** verify or reject deposits, record loan repayments, keep the bank transaction ledger.
- **Loan officer:** review pending loan applications, approve or reject.
- **Member:** dashboard with savings and outstanding loan balance, apply for a loan.
- **Admin / System Administrator:** manage employees, members and user accounts, view reports and the audit log.
- **Accounts:** login with role-based access, change password, forgot/reset password.
- **Public pages:** landing page introducing the SACCO, and a login page.

## Tech stack

| Layer | Technology |
|---|---|
| Front-end | React 19, Vite, react-router-dom |
| Back-end | Node.js 18+, Express, JWT, bcrypt |
| Database | MySQL 8 (or MariaDB 10.5+) with triggers, stored procedures and a view |

## Project structure

```
Umoja-Sacco-System/
├── backend/     Express API, database setup/seed scripts, tests (see backend/README.md)
├── database/    SQL: schema, procedures, triggers, member dashboard view
└── frontend/    React + Vite app
```

## Getting started

### 1. Prerequisites
- Node.js 18 or newer
- MySQL 8 (or MariaDB) running locally
- Git

### 2. Clone
```
git clone https://github.com/Kiptoo345/Umoja-Sacco-System.git
cd Umoja-Sacco-System
```

### 3. Back-end and database
```
cd backend
npm install
```
Copy `.env.example` to `.env` and fill in `DB_USER`, `DB_PASSWORD` and `JWT_SECRET` (keep `DB_NAME=umoja_sacco_db`). Then:
```
npm run setup-db
npm run seed
npm start
```
The API runs at http://localhost:3000/api/health. `npm test` runs the end-to-end checks.

If `npm run setup-db` fails with an empty "Setup failed", MySQL is usually not running, or `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD` in `.env` are wrong.

### 4. Front-end
In a second terminal:
```
cd frontend
npm install
```
Copy `.env.example` to `.env` (it points to `http://localhost:3000/api`). Then:
```
npm run dev
```
Open the address Vite prints, usually http://localhost:5173.

### 5. Sign in
Seeded accounts (password `Password123!`, for development only):

| Username | Role |
|---|---|
| admin | Admin |
| sysadmin | System Administrator |
| staff1 | Staff |
| officer1 | Loan Officer |
| accountant1 | Accountant |

Members log in with the username given at registration (default: their email) and the temporary password shown once after registration.

## Password reset

Users can reset a forgotten password from the login page. There is no email service yet, so when `RETURN_RESET_TOKEN=true` is set in the back-end `.env`, the reset code is shown on screen. In a real deployment this will be switched off and the code emailed directly to the user.

## Business rules

- A deposit counts toward savings only after an accountant verifies it.
- Loan interest is flat, set by `INTEREST_RATE` in the back-end `.env`.
- A member can have only one open loan at a time.
- Repayments reduce the loan balance and close the loan when it is fully paid.

## More documentation

- `backend/README.md`: full API endpoint table, roles and database notes.
- Project documentation, UML diagrams and UI mockups

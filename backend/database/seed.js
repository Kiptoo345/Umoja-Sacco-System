// Creates one starter account per employee role in the teammate's tables. Run once: npm run seed
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

const PASSWORD = 'Password123!';   // change after first login
// [username, role, first name, last name, position, email, phone]
const accounts = [
  ['admin',       'Admin',                'Alice',  'Admin',      'Administrator',        'admin@umoja.test',      '0700000001'],
  ['sysadmin',    'System Administrator', 'Sam',    'SysAdmin',   'System Administrator', 'sysadmin@umoja.test',   '0700000002'],
  ['staff1',      'Staff',                'Stella', 'Staff',      'Front Office',         'staff1@umoja.test',     '0700000003'],
  ['officer1',    'Loan Officer',         'Leo',    'Officer',    'Loan Officer',         'officer1@umoja.test',   '0700000004'],
  ['accountant1', 'Accountant',           'Amina',  'Accountant', 'Accountant',           'accountant1@umoja.test','0700000005'],
];

(async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);
  for (const [username, role, first, last, position, email, phone] of accounts) {
    const [exists] = await pool.execute('SELECT user_id FROM User WHERE username=?', [username]);
    if (exists.length) { console.log('skip (exists):', username); continue; }
    const [r] = await pool.execute('SELECT role_id FROM Role WHERE role_name=?', [role]);
    if (!r.length) throw new Error(`Role "${role}" not found. Did setup-db load the teammate's Umoja_sacco_db.sql?`);
    const [u] = await pool.execute('INSERT INTO User (username, password_hash, email, role_id) VALUES (?,?,?,?)', [username, hash, email, r[0].role_id]);
    await pool.execute('INSERT INTO Staff (user_id, first_name, last_name, position, phone_number) VALUES (?,?,?,?,?)', [u.insertId, first, last, position, phone]);
    console.log('created:', username, `(${role})`);
  }
  console.log(`Done. Default password for all: ${PASSWORD}`);
  await pool.end();
})().catch((e) => { console.error(e.message); process.exit(1); });

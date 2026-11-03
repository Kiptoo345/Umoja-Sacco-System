// Builds the database from your teammate's files on the `schema` branch, then adds database/extras.sql.
//   npm run setup-db             (first time; skips if the database already exists)
//   node database/setup.js --reset   (drops umoja_sacco_db and rebuilds it: you lose all data)
// It reads the teammate's files with `git show origin/schema:<file>`, so nothing is copied into your working tree.
// If git cannot find them, put copies in backend/database/teammate/ and the script will use those instead.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const mysql = require('mysql2/promise');

const DB = process.env.DB_NAME || 'umoja_sacco_db';
const FILES = ['Umoja_sacco_db.sql', 'RegisterNewMember.sql', 'AfterDepositVerified.sql',
               'ApproveLoanApplication.sql', 'AfterLoanRepayment.sql', 'View_MemberDashboard.sql'];

function git(args, cwd) { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
function readTeammateFile(name) {
  const local = path.join(__dirname, 'teammate', name);
  if (fs.existsSync(local)) return fs.readFileSync(local, 'utf8');
  try {
    const root = git(['rev-parse', '--show-toplevel'], __dirname).trim();
    for (const ref of ['origin/schema', 'schema']) { try { return git(['show', `${ref}:${name}`], root); } catch {} }
  } catch {}
  throw new Error(`Cannot find ${name}. Run "git fetch origin" first, or copy it into backend/database/teammate/`);
}

// Splits a .sql file into statements, understanding the mysql client's DELIMITER command.
function splitSql(sql) {
  const out = []; let delim = ';'; let buf = [];
  for (let line of sql.replace(/\r/g, '').split('\n')) {
    const t = line.trim();
    const m = t.match(/^DELIMITER\s+(\S+)/i);
    if (m) { delim = m[1]; continue; }
    if (!t || t.startsWith('--')) continue;
    line = line.replace(/\s--\s.*$/, '');
    buf.push(line);
    if (line.trimEnd().endsWith(delim)) {
      const stmt = buf.join('\n').trimEnd().slice(0, -delim.length).trim();
      if (stmt) out.push(stmt);
      buf = [];
    }
  }
  const rest = buf.join('\n').trim();
  if (rest) out.push(rest);
  return out;
}

(async () => {
  if (!/^\w+$/.test(DB)) throw new Error('DB_NAME may only contain letters, numbers and underscores');
  if (DB !== 'umoja_sacco_db') console.warn('Warning: your teammate\'s SQL creates "umoja_sacco_db"; set DB_NAME=umoja_sacco_db in .env');
  const conn = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD });
  const run = async (sql) => { for (const s of splitSql(sql)) await conn.query(s); };

  if (process.argv.includes('--reset')) { await conn.query(`DROP DATABASE IF EXISTS \`${DB}\``); console.log('Dropped', DB); }
  const [exists] = await conn.query('SHOW DATABASES LIKE ?', [DB]);
  if (exists.length) {
    console.log(`Database ${DB} already exists: leaving the teammate's tables untouched (use --reset to rebuild).`);
  } else {
    for (const f of FILES) { await run(readTeammateFile(f)); console.log('loaded', f); }
  }
  await run(fs.readFileSync(path.join(__dirname, 'extras.sql'), 'utf8'));
  console.log('loaded extras.sql (AuditLog, PasswordReset)');
  await conn.end();
})().catch((e) => { console.error('Setup failed:', e.message); process.exit(1); });

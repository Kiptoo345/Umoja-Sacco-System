// Audit trail: who did what, when. Pass a transaction connection so the log commits or rolls back with the action.
// The AuditLog table comes from database/extras.sql. If it has not been created yet, logging is skipped (with a warning).
let warned = false;
async function audit(db, userId, action, details, ip) {
  try {
    await db.execute('INSERT INTO AuditLog (user_id, action, details, ip_address) VALUES (?,?,?,?)',
      [userId ?? null, action, String(details || '').slice(0, 500), ip ?? null]);
  } catch (e) {
    if (e.code !== 'ER_NO_SUCH_TABLE') throw e;
    if (!warned) { console.warn('AuditLog table missing: run "npm run setup-db" to add database/extras.sql'); warned = true; }
  }
}
module.exports = { audit };

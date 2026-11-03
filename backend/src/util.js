// Small helpers: errors, async wrapper, input validation.
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function amount(v, field = 'amount') {
  const n = Number(v);
  if (v === '' || v === null || !Number.isFinite(n) || n <= 0 || n > 1e9)
    throw new HttpError(400, `${field} must be a positive number`);
  return Math.round(n * 100) / 100;
}
function text(v, field, { min = 1, max = 100 } = {}) {
  if (typeof v !== 'string') throw new HttpError(400, `${field} is required`);
  const t = v.trim();
  if (t.length < min || t.length > max)
    throw new HttpError(400, `${field} must be ${min} to ${max} characters`);
  return t;
}
function password(v, field = 'password') {
  if (typeof v !== 'string' || v.length < 8 || v.length > 72)
    throw new HttpError(400, `${field} must be 8 to 72 characters`);
  return v;
}
const today = () => new Date().toISOString().slice(0, 10);
function dateOrToday(v) {
  if (!v) return today();
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || isNaN(Date.parse(v)))
    throw new HttpError(400, 'date must be in YYYY-MM-DD format');
  return v;
}
module.exports = { HttpError, wrap, amount, text, password, today, dateOrToday };

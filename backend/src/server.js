// Umoja Community SACCO API: entry point.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { HttpError } = require('./util');

if (!process.env.JWT_SECRET) { console.error('JWT_SECRET is missing. Copy .env.example to .env first.'); process.exit(1); }

const app = express();
app.use(helmet());
app.use(cors());

// Slow down password guessing: max 10 login attempts per IP every 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', loginLimiter);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/members', require('./routes/members'));
app.use('/api/deposits', require('./routes/deposits'));
app.use('/api/loans', require('./routes/loans'));
app.use('/api/bank-transactions', require('./routes/bank'));
app.use('/api', require('./routes/admin'));

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Central error handler: friendly messages, no stack traces leaked.
app.use((err, req, res, next) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That record already exists (duplicate value)' });
  if (err.code === 'ER_CHECK_CONSTRAINT_VIOLATED' || err.code === 'ER_CONSTRAINT_FAILED') return res.status(400).json({ error: 'Value rejected by a database rule' });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const port = Number(process.env.PORT || 3000);
if (require.main === module) app.listen(port, () => console.log(`Umoja SACCO API running on http://localhost:${port}`));
module.exports = app;

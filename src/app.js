const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { db } = require('./config/db');
const { clientUrl } = require('./config/env');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', async (req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 });

app.use('/api/auth', authLimiter, require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/programs', require('./modules/programs/programs.routes'));
app.use('/api/periods', require('./modules/periods/periods.routes'));
app.use('/api/applications', require('./modules/applications/applications.routes'));
app.use('/api/fees', require('./modules/fees/fees.routes'));
app.use('/api/payments', require('./modules/payments/payments.routes'));
app.use('/api/audit-logs', require('./modules/audit/audit.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const env = require('./config/env');
const logger = require('./utils/logger');
const { dbHealth } = require('./config/db');
const jobsRoutes = require('./routes/jobsRoutes');
const ingestionRoutes = require('./routes/ingestionRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(mongoSanitize());
app.use(
  morgan('short', {
    stream: { write: (msg) => logger.http?.(msg.trim()) || logger.info(msg.trim()) },
  })
);

// Protect our own API from abuse — unrelated to how we treat the upstream source.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

app.get('/health', (req, res) => {
  res.json({ ok: true, db: dbHealth(), uptime: process.uptime() });
});

app.use('/api/jobs', jobsRoutes);
app.use('/api/ingestion', ingestionRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

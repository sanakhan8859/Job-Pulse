require('dotenv').config();

function toInt(value, fallback) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

const env = {
  PORT: toInt(process.env.PORT, 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || '',
  CLIENT_ORIGIN: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),

  INGESTION_INTERVAL_MINUTES: toInt(process.env.INGESTION_INTERVAL_MINUTES, 30),
  ARBEITNOW_API_URL:
    process.env.ARBEITNOW_API_URL || 'https://www.arbeitnow.com/api/job-board-api',
  SOURCE_USER_AGENT:
    process.env.SOURCE_USER_AGENT || 'job-aggregator-demo/1.0',
  MAX_PAGES_PER_RUN: toInt(process.env.MAX_PAGES_PER_RUN, 3),
  SOURCE_REQUEST_DELAY_MS: toInt(process.env.SOURCE_REQUEST_DELAY_MS, 1200),

  CIRCUIT_BREAKER_THRESHOLD: toInt(process.env.CIRCUIT_BREAKER_THRESHOLD, 3),
  CIRCUIT_BREAKER_COOLDOWN_MS: toInt(process.env.CIRCUIT_BREAKER_COOLDOWN_MS, 300000),

  INGESTION_TRIGGER_KEY: process.env.INGESTION_TRIGGER_KEY || 'change-me-please',

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};

module.exports = env;

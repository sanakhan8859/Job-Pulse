const IngestionLog = require('../models/IngestionLog');
const { runIngestion, getStatus } = require('../services/ingestionService');
const env = require('../config/env');

async function status(req, res, next) {
  try {
    const recentLogs = await IngestionLog.find().sort({ createdAt: -1 }).limit(10).lean();
    res.json({ ...getStatus(), recentLogs });
  } catch (err) {
    next(err);
  }
}

async function trigger(req, res, next) {
  try {
    const key = req.headers['x-ingestion-key'];
    if (key !== env.INGESTION_TRIGGER_KEY) {
      return res.status(401).json({ message: 'Invalid or missing X-Ingestion-Key header' });
    }

    const result = await runIngestion({ source: 'arbeitnow', trigger: 'manual' });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { status, trigger };

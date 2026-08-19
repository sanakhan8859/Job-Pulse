const cron = require('node-cron');
const env = require('../config/env');
const logger = require('../utils/logger');
const { runIngestion } = require('../services/ingestionService');

let task = null;

function startScheduler() {
  const minutes = Math.max(1, env.INGESTION_INTERVAL_MINUTES);
  const cronExpr = `*/${minutes} * * * *`;

  task = cron.schedule(cronExpr, async () => {
    await runIngestion({ source: 'arbeitnow', trigger: 'scheduled' });
  });

  logger.info(`Scheduler started: ingestion runs every ${minutes} minute(s)`);

  // Kick off one run shortly after boot so the DB isn't empty on first load.
  setTimeout(() => {
    runIngestion({ source: 'arbeitnow', trigger: 'scheduled' }).catch((err) =>
      logger.error(`Initial ingestion run failed: ${err.message}`)
    );
  }, 3000);

  return task;
}

function stopScheduler() {
  if (task) task.stop();
}

module.exports = { startScheduler, stopScheduler };

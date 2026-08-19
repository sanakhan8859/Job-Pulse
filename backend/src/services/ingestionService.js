const Job = require('../models/Job');
const IngestionLog = require('../models/IngestionLog');
const logger = require('../utils/logger');
const env = require('../config/env');
const { CircuitBreaker } = require('./retry');
const arbeitnowSource = require('./sources/arbeitnowSource');

// One breaker per source so one bad source doesn't block others.
const breakers = {
  arbeitnow: new CircuitBreaker({
    threshold: env.CIRCUIT_BREAKER_THRESHOLD,
    cooldownMs: env.CIRCUIT_BREAKER_COOLDOWN_MS,
    name: 'arbeitnow',
  }),
};

const SOURCES = {
  arbeitnow: arbeitnowSource,
};

let lastRunSummary = null;
let isRunning = false;

/**
 * Upserts normalized jobs in one bulk operation (idempotent — safe to run
 * on a schedule against overlapping data) and marks previously-seen jobs
 * from this source that did NOT show up in this run as "stale" rather than
 * deleting them, so a transient empty/partial response never wipes data.
 */
async function persistJobs(source, jobs) {
  if (jobs.length === 0) return { upserted: 0 };

  const ops = jobs.map((job) => ({
    updateOne: {
      filter: { source: job.source, externalId: job.externalId },
      update: { $set: job },
      upsert: true,
    },
  }));

  const result = await Job.bulkWrite(ops, { ordered: false });
  const upserted = (result.upsertedCount || 0) + (result.modifiedCount || 0);

  const seenIds = jobs.map((j) => j.externalId);
  const staleResult = await Job.updateMany(
    { source, externalId: { $nin: seenIds }, isStale: false },
    { $set: { isStale: true } }
  );

  return { upserted, staleMarked: staleResult.modifiedCount || 0 };
}

async function runIngestion({ source = 'arbeitnow', trigger = 'scheduled' } = {}) {
  if (isRunning) {
    logger.warn('Ingestion already in progress, skipping overlapping run');
    return { skipped: true, reason: 'already_running' };
  }

  const breaker = breakers[source];
  const adapter = SOURCES[source];

  if (!adapter) {
    throw new Error(`Unknown source: ${source}`);
  }

  if (breaker && !breaker.canAttempt()) {
    logger.warn(`Circuit open for ${source}, skipping this run`);
    await IngestionLog.create({
      source,
      trigger,
      status: 'skipped_circuit_open',
      errorMessage: 'Circuit breaker open — source recently failed repeatedly.',
    });
    return { skipped: true, reason: 'circuit_open' };
  }

  isRunning = true;
  const startedAt = Date.now();
  logger.info(`Starting ingestion run for source="${source}" trigger="${trigger}"`);

  try {
    const result = await adapter.fetchListings();
    const { upserted, staleMarked } = await persistJobs(source, result.jobs);

    breaker?.onSuccess();

    const status = result.warnings.length > 0 ? 'partial' : 'success';

    const log = await IngestionLog.create({
      source,
      trigger,
      status,
      pagesFetched: result.pagesFetched,
      itemsFetched: result.rawCount,
      itemsUpserted: upserted,
      itemsSkippedInvalid: result.invalidCount,
      staleMarked,
      durationMs: Date.now() - startedAt,
      warnings: result.warnings,
    });

    lastRunSummary = log.toObject();
    logger.info(
      `Ingestion "${source}" finished: ${status} | fetched=${result.rawCount} upserted=${upserted} invalid=${result.invalidCount} stale=${staleMarked}`
    );

    return lastRunSummary;
  } catch (err) {
    breaker?.onFailure();
    logger.error(`Ingestion "${source}" failed: ${err.message}`);

    const log = await IngestionLog.create({
      source,
      trigger,
      status: 'failed',
      durationMs: Date.now() - startedAt,
      errorMessage: err.message,
    });

    lastRunSummary = log.toObject();
    // Swallow the error here so a scheduled run never crashes the process —
    // the failure is recorded and the next scheduled tick will try again.
    return lastRunSummary;
  } finally {
    isRunning = false;
  }
}

function getStatus() {
  return {
    isRunning,
    lastRun: lastRunSummary,
    breakers: Object.fromEntries(
      Object.entries(breakers).map(([name, b]) => [name, b.getStatus()])
    ),
  };
}

module.exports = { runIngestion, getStatus };

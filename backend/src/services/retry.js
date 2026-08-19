const logger = require('../utils/logger');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `fn` with exponential backoff + jitter.
 * This is generic resilience against transient failures (timeouts, 5xx,
 * connection resets) — NOT a bot-evasion device. It backs off, it doesn't
 * hide who is asking.
 */
async function withRetry(fn, { retries = 3, baseDelayMs = 1000, label = 'operation' } = {}) {
  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastError = err;
      const status = err.response?.status;

      // Don't retry client errors that a retry can't fix (bad request, not found).
      // Do retry timeouts, network errors, 429s and 5xx.
      const retriable =
        !status || status === 429 || status >= 500 || err.code === 'ECONNABORTED';

      if (!retriable || attempt === retries) {
        break;
      }

      const delay = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 300);
      logger.warn(
        `${label} failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms: ${err.message}`
      );
      await sleep(delay);
      attempt += 1;
    }
  }

  throw lastError;
}

/**
 * Minimal circuit breaker. After N consecutive failures it "opens" and
 * short-circuits further calls for a cooldown window, so a source that's
 * down (or actively blocking us) doesn't get hammered with retries.
 */
class CircuitBreaker {
  constructor({ threshold = 3, cooldownMs = 300000, name = 'breaker' } = {}) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
    this.name = name;
    this.failureCount = 0;
    this.state = 'closed'; // closed | open | half-open
    this.openedAt = null;
  }

  canAttempt() {
    if (this.state === 'closed') return true;
    if (this.state === 'open') {
      const elapsed = Date.now() - this.openedAt;
      if (elapsed >= this.cooldownMs) {
        this.state = 'half-open';
        logger.info(`Circuit "${this.name}" half-open, allowing a trial request`);
        return true;
      }
      return false;
    }
    // half-open: allow exactly one trial call at a time
    return true;
  }

  onSuccess() {
    if (this.state !== 'closed') {
      logger.info(`Circuit "${this.name}" closing after successful trial`);
    }
    this.failureCount = 0;
    this.state = 'closed';
    this.openedAt = null;
  }

  onFailure() {
    this.failureCount += 1;
    if (this.state === 'half-open' || this.failureCount >= this.threshold) {
      this.state = 'open';
      this.openedAt = Date.now();
      logger.warn(
        `Circuit "${this.name}" OPEN after ${this.failureCount} consecutive failures. Cooling down ${this.cooldownMs}ms.`
      );
    }
  }

  getStatus() {
    return { name: this.name, state: this.state, failureCount: this.failureCount };
  }
}

module.exports = { withRetry, CircuitBreaker, sleep };

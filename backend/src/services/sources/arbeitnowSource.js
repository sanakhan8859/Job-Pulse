const axios = require('axios');
const { z } = require('zod');
const env = require('../../config/env');
const logger = require('../../utils/logger');
const { withRetry, sleep } = require('../retry');

const SOURCE_NAME = 'arbeitnow';

/**
 * Schema for a single listing as arbeitnow's public API returns it today.
 * If the source changes its shape overnight, individual records that no
 * longer match get skipped (and logged) instead of throwing the whole
 * ingestion run away — see ingestionService for how this feeds resilience.
 */
const listingSchema = z.object({
  slug: z.string(),
  company_name: z.string().default('Unknown company'),
  title: z.string(),
  description: z.string().default(''),
  remote: z.boolean().default(false),
  url: z.string().url(),
  tags: z.array(z.string()).default([]),
  job_types: z.array(z.string()).default([]),
  location: z.string().default('Not specified'),
  created_at: z.union([z.number(), z.string()]).optional(),
});

const responseSchema = z.object({
  data: z.array(z.unknown()),
  links: z
    .object({
      next: z.string().nullable().optional(),
    })
    .optional(),
});

function normalize(rawListing) {
  const parsed = listingSchema.safeParse(rawListing);
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues.map((i) => i.message) };
  }

  const l = parsed.data;
  const postedAt = l.created_at
    ? new Date(typeof l.created_at === 'number' ? l.created_at * 1000 : l.created_at)
    : null;

  return {
    ok: true,
    job: {
      externalId: l.slug,
      source: SOURCE_NAME,
      title: l.title,
      company: l.company_name,
      location: l.location,
      remote: l.remote,
      description: l.description,
      tags: l.tags,
      jobTypes: l.job_types,
      url: l.url,
      salary: null,
      postedAt: Number.isNaN(postedAt?.getTime()) ? null : postedAt,
      fetchedAt: new Date(),
      lastSeenAt: new Date(),
    },
  };
}

/**
 * Fetches up to `maxPages` pages from the public arbeitnow board API.
 * Politeness/pacing: waits SOURCE_REQUEST_DELAY_MS between page requests
 * instead of firing them concurrently, and identifies itself with an
 * honest, contactable User-Agent rather than mimicking a browser.
 */
async function fetchListings({ maxPages = env.MAX_PAGES_PER_RUN } = {}) {
  const allRaw = [];
  let url = env.ARBEITNOW_API_URL;
  let page = 0;
  const warnings = [];

  while (url && page < maxPages) {
    const response = await withRetry(
      () =>
        axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': env.SOURCE_USER_AGENT,
            Accept: 'application/json',
          },
        }),
      { retries: 3, baseDelayMs: 800, label: `${SOURCE_NAME} page ${page + 1}` }
    );

    const parsedBody = responseSchema.safeParse(response.data);
    if (!parsedBody.success) {
      warnings.push(
        `Response shape for ${SOURCE_NAME} page ${page + 1} did not match the expected schema — source may have changed its API.`
      );
      break; // don't try to walk pagination we can no longer trust
    }

    if (parsedBody.data.data.length === 0) {
      warnings.push(`Empty page received from ${SOURCE_NAME} at page ${page + 1}; stopping pagination.`);
      break;
    }

    allRaw.push(...parsedBody.data.data);
    url = parsedBody.data.links?.next || null;
    page += 1;

    if (url && page < maxPages) {
      await sleep(env.SOURCE_REQUEST_DELAY_MS);
    }
  }

  const normalized = [];
  let invalidCount = 0;
  for (const raw of allRaw) {
    const result = normalize(raw);
    if (result.ok) {
      normalized.push(result.job);
    } else {
      invalidCount += 1;
    }
  }

  if (invalidCount > 0) {
    warnings.push(`${invalidCount} record(s) skipped for not matching the expected listing shape.`);
  }

  return {
    source: SOURCE_NAME,
    pagesFetched: page,
    rawCount: allRaw.length,
    jobs: normalized,
    invalidCount,
    warnings,
  };
}

module.exports = { fetchListings, normalize, SOURCE_NAME };

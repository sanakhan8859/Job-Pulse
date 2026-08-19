# Decisions

## 1. Why this ingestion strategy over the obvious alternative

The obvious alternative was a headless-browser pipeline (Playwright/Puppeteer) with proxy
rotation and fingerprint spoofing — the "real" version of what Part 1 describes for LinkedIn/
Indeed. I rejected it for this build, for three reasons:

- **The brief's own guardrail rules it out for the demo.** It explicitly asks for a public
  source, not a live account, so building stealth infrastructure here would be solving a
  problem the deliverable isn't allowed to touch.
- **It's the fragile choice, not just the risky one.** Headless scraping breaks on every markup
  change and needs constant selector maintenance; an API-polling client against a documented
  JSON endpoint degrades gracefully (schema validation catches shape drift instead of silently
  returning garbage).
- **Even against a permissive source, I didn't want to demonstrate bad citizenship.** I used
  paced, sequential requests with backoff and a circuit breaker rather than pulling all pages
  concurrently — the same pattern I'd want in place before ever pointing this at something more
  sensitive.

## 2. One trade-off made under the time limit

I built one source adapter (arbeitnow) instead of a fleshed-out multi-source registry, and I
verified behavior with targeted unit checks (normalizer, circuit breaker, app boot) rather than
a full automated test suite.

With a real week I'd: add 2-3 more public sources (RemoteOK, a job-board RSS feed) behind the
same adapter interface to prove the abstraction actually holds up; add a Jest/Supertest suite
covering the ingestion service end-to-end (mocked HTTP failures, malformed payloads, empty
pages); add cross-source deduplication (title + company fuzzy match, since URL-based dedupe
only works within a single source); and add a small admin view over ingestion history instead of
just the last-10-runs list.

## 3. Where AI tools were used, and what was verified after

The full backend and frontend scaffold — models, ingestion service, retry/circuit-breaker logic,
controllers, routes, and the React components — was generated with Claude in this conversation,
in response to the architecture I specified (Node/Express/MongoDB, React/Vite/Tailwind, no
deployment config).

Verified during generation, in the sandbox, before delivery:
- `node --check` against every backend source file (syntax).
- The app boots and `/health` responds correctly with no database connected.
- The arbeitnow normalizer was unit-tested directly against a realistic valid payload and a
  deliberately broken one, confirming malformed records are caught (not silently dropped or
  crash-inducing) and the reported issues are accurate.
- The circuit breaker's open/closed/half-open transitions were exercised directly.
- `npm install` and `vite build` were run for real on the frontend — it compiles clean.

**Not yet done, and owed before this goes in a submission:** an actual run against a live
MongoDB instance, a full click-through of the UI against a running backend, and a read-through
of the ingestion service and source adapter line-by-line — the parts most tied to the grading
criteria (resilience, pacing) are exactly where I want my own eyes on the logic, not just a
green build.

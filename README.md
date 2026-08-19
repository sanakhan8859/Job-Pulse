# JobPulse — Job Listings Aggregator

A working demo of an ingestion pipeline + API + UI for job listings, built to the
"Part 1" brief: get data out reliably, resiliently, and within the scope guardrail
(a public, no-auth job board API — **not** a scraped LinkedIn/Indeed session).

Stack: **Node.js / Express / MongoDB (Mongoose)** backend, **React (Vite) + Tailwind CSS** frontend.

---

## What it actually does

- Pulls live listings from **arbeitnow.com's public Job Board API** (`GET /api/job-board-api`,
  no key required) on a schedule (`node-cron`) and on manual trigger.
- Normalizes + validates each record against a schema (`zod`). Records that don't match get
  skipped and logged, not thrown away as a batch.
- Upserts into MongoDB idempotently (`bulkWrite`, unique on `source + externalId`), so
  overlapping runs never duplicate data.
- Listings that stop appearing in the source feed are marked `isStale` instead of deleted —
  a bad/empty response never wipes the database.
- Retries transient failures (timeouts, 5xx, 429) with exponential backoff + jitter, and trips
  a per-source circuit breaker after repeated failures so a dead source doesn't get hammered.
- Every run is logged (`IngestionLog`) with counts, warnings, and errors — visible in the UI's
  ingestion status panel.
- React frontend: search, filters (location, remote/on-site, tags), sort, pagination, a job
  detail modal, and a live ingestion-status sidebar — fully responsive.

## Project layout

```
job-aggregator/
├── backend/
│   ├── src/
│   │   ├── config/         # env, mongoose connection
│   │   ├── models/         # Job, IngestionLog
│   │   ├── services/       # ingestion orchestration, retry/circuit breaker, source adapters
│   │   ├── controllers/    # request handlers
│   │   ├── routes/         # /api/jobs, /api/ingestion
│   │   ├── middleware/     # error handling
│   │   ├── jobs/           # cron scheduler
│   │   ├── utils/logger.js
│   │   ├── app.js          # express app (no listen)
│   │   └── server.js       # connects DB, starts scheduler, listens
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/client.js
    │   ├── components/
    │   ├── hooks/
    │   ├── pages/Home.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    ├── tailwind.config.js
    └── .env.example
```

## Running it locally

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# paste your MongoDB Compass / Atlas connection string into MONGODB_URI
npm run dev
```

The server starts on `http://localhost:5000`, connects to Mongo, starts the cron scheduler,
and kicks off one ingestion run ~3 seconds after boot so the database isn't empty on first load.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens on `http://localhost:5173`. Vite's dev server proxies `/api/*` to `http://localhost:5000`
(see `vite.config.js`), so no CORS setup is needed locally.

## API reference

| Method | Path                    | Description                                              |
|--------|--------------------------|------------------------------------------------------------|
| GET    | `/health`                | Server + DB health check                                  |
| GET    | `/api/jobs`               | List jobs — `search`, `location`, `remote`, `tags`, `sort`, `page`, `limit` |
| GET    | `/api/jobs/:id`           | Single job by Mongo `_id`                                  |
| GET    | `/api/jobs/stats`         | Totals, remote count, counts by source, top tags            |
| GET    | `/api/ingestion/status`   | Current run state, circuit breaker state, last 10 run logs |
| POST   | `/api/ingestion/trigger`  | Manually trigger a run — requires header `X-Ingestion-Key: <INGESTION_TRIGGER_KEY>` |

## Design notes (how this maps to the brief)

**1. Detection surface.** Not applicable in the way it would be for LinkedIn/Indeed — this demo
targets a public API that's meant to be called programmatically, so there's no fingerprinting,
CAPTCHA, or session state to work around. The honest analogue implemented here: the app
identifies itself with a real, contactable `User-Agent` (`SOURCE_USER_AGENT` in `.env`) rather
than spoofing a browser.

**2. Ingestion strategy.** Paced sequential requests (`SOURCE_REQUEST_DELAY_MS` between
paginated calls, capped by `MAX_PAGES_PER_RUN`) rather than concurrent hammering. A scheduled
cron job plus a manually-triggerable endpoint. A per-source circuit breaker is the "plan B" —
if the source starts erroring repeatedly, the breaker opens and the pipeline backs off for a
cooldown window instead of retrying into a wall.

**3. Resilience.** Schema validation (`zod`) catches markup/shape changes at the record level —
bad records are skipped and logged, not fatal. Empty pages stop pagination early instead of
looping. Exponential backoff + jitter absorbs transient network/5xx/429 failures. Idempotent
upserts mean a partial run never corrupts existing data, and stale-marking (instead of deleting)
means an empty response never wipes the database. Every run's outcome is persisted to
`IngestionLog` so failures are visible, not silent.

**4. Where this stops.** This demo deliberately only talks to a source that publishes a free,
public, no-auth API for exactly this purpose — it does not authenticate as a user, does not
touch LinkedIn/Indeed/Naukri/Wellfound, and does not attempt to defeat bot detection anywhere.
Extending this pattern to a ToS-restricted platform is out of scope for this build; that's a
different conversation about authorization, not engineering.

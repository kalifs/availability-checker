# Restaurant Availability Monitor

Tracks live availability of restaurant listings on a delivery platform against their expected opening hours, for an operations team to spot mismatches.

## Structure

```
apps/frontend   React + TypeScript dashboard
apps/backend    Express + TypeScript API (reads latest snapshots from SQLite)
apps/worker     One-shot TypeScript CLI pipeline (fetch -> normalize -> persist), meant to be run by cron
packages/shared Shared TypeScript types
docs/           Architecture doc and decision log
```

## Getting started

Install everything once from the repo root:

```sh
npm install
```

Each app runs independently:

```sh
npm run dev --workspace=@monitor/frontend   # dashboard, Vite dev server
npm run dev --workspace=@monitor/backend    # API, http://localhost:3001
npm run start --workspace=@monitor/worker   # one-shot pipeline run (build first: npm run build --workspace=@monitor/worker)
```

The worker is not a long-running server — invoke it on a schedule (cron, CI scheduled job, etc.) rather than leaving it running.

See [docs/architecture.md](docs/architecture.md) for the system design and [docs/decision-log.md](docs/decision-log.md) for the reasoning behind key choices.

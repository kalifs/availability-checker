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

## Installation

Prerequisites:
- Node.js 20+ and npm 10+ (needed for native module support and workspaces).
- A C/C++ build toolchain, needed by `better-sqlite3` to compile its native addon on install: on Debian/Ubuntu, `sudo apt-get install -y build-essential python3`; on macOS, `xcode-select --install`; on Windows, install the "Desktop development with C++" workload via Visual Studio Build Tools.
- **No separate database server to install.** `better-sqlite3` embeds SQLite directly in the Node process — there's no MySQL/Postgres/SQLite daemon to run or configure; the pipeline just writes to a local file (`data/monitor.sqlite`).

1. Clone the repo and move into it.
2. Install all workspace dependencies from the repo root:

   ```sh
   npm install
   ```

   This also builds `better-sqlite3`'s native addon using the toolchain above (its install script is pre-approved in the root `package.json`'s `allowScripts`). If this step fails, it's almost always the build toolchain prerequisite above being missing.
3. Build the shared package and worker once, then run the pipeline to seed the local SQLite database:

   ```sh
   npm run build --workspace=@monitor/shared
   npm run build --workspace=@monitor/worker
   npm run start --workspace=@monitor/worker
   ```

   This writes to `data/monitor.sqlite` (path overridable via `MONITOR_DB_PATH`). Re-run it any time to refresh snapshots.
4. Start the backend and frontend (see below).

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

## Tests

Unit/integration tests (Vitest):

```sh
npm test
```

End-to-end tests (Playwright) covering the dashboard's critical paths — listing rendering, mismatch highlighting, the backend-unreachable error state, and the refresh button. Self-contained: builds, seeds a dedicated `data/e2e.sqlite`, and starts the backend/frontend on isolated ports (3101/4301) automatically.

```sh
npx playwright install chromium   # once, downloads the browser binary
npm run test:e2e
```

See [docs/architecture.md](docs/architecture.md) for the system design and [docs/decision-log.md](docs/decision-log.md) for the reasoning behind key choices.

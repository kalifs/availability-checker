# Architecture

## C1 — System Context

Who uses the system, and which external system it depends on.

```mermaid
C4Context
title System Context — Restaurant Availability Monitor

Person(ops, "Operations team", "Monitors restaurant availability across locations")
System(monitor, "Availability Monitor", "Tracks expected vs actual availability for restaurant listings")
System_Ext(platform, "Delivery platform (Deliveroo)", "Public, unauthenticated store pages: opening hours + live availability")

Rel(ops, monitor, "Views dashboard, spots mismatches")
Rel(monitor, platform, "Fetches listing pages / public routes (no auth)")
```

Constraint: the monitor only ever calls public, unauthenticated routes on the delivery platform — no login, no private API keys, no bypassing bot protection.

## C2 — Container

How the system is split into independently deployable/runnable pieces.

```mermaid
C4Container
title Container Diagram — Restaurant Availability Monitor

Person(ops, "Operations team")
System_Boundary(monitor, "Availability Monitor") {
  Container(frontend, "Frontend", "React + TypeScript (Vite)", "Dashboard: expected vs actual state, mismatch highlighting")
  Container(backend, "Backend API", "Express + TypeScript", "Serves restaurants + latest snapshots + computed expected state")
  Container(worker, "Pipeline / Worker", "TypeScript CLI", "One-shot job: fetch listing -> normalize -> persist. Invoked by cron or HTTP trigger, then exits")
  ContainerDb(db, "Database", "SQLite", "Restaurants, opening hours, availability snapshots")
}
System_Ext(platform, "Delivery platform (Deliveroo)", "Public store pages")
System_Ext(scheduler, "Scheduler (cron / HTTP trigger)", "Triggers the worker on an interval")

Rel(ops, frontend, "HTTPS")
Rel(frontend, backend, "REST / JSON")
Rel(backend, db, "Reads latest snapshots")
Rel(scheduler, worker, "Triggers a run")
Rel(worker, platform, "Fetches public listing data")
Rel(worker, db, "Writes snapshot rows")
```

Notes:
- `frontend`, `backend`, and `worker` are separate apps in the monorepo (`apps/frontend`, `apps/backend`, `apps/worker`), each with its own `package.json` and start script, so they can be started/deployed independently.
- `worker` is not a long-running server: it runs once per invocation and exits, matching the "cron job or HTTP request" execution model from the brief.
- `backend` never talks to the delivery platform directly — only `worker` does. This keeps the read path (dashboard) fast and decoupled from platform flakiness.

## Still to fill in (later iterations)

- **Resilience & health**: how failures in the worker (unreachable platform, malformed response) are surfaced, retried, and alerted on.
- **Data currency at scale**: design for near real-time accuracy across tens of thousands of restaurants.
- **Real-time notifications**: how ops gets alerted on expected/actual mismatches.
- **Cost estimate** at 10,000 tracked restaurants.
- **Code-to-architecture mapping**: how this repo's apps map onto the production design above.

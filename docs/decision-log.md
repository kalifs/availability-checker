# Decision log

## Significant choices
- **Deliveroo** as the delivery platform: public store pages expose opening hours and order-acceptance state without auth.
- **npm workspaces**, no Turborepo/Nx: keeps the monorepo simple for a ~4-hour scope; `apps/frontend`, `apps/backend`, `apps/worker` each start independently, `packages/shared` holds cross-app types.
- **Worker as a one-shot CLI**, not a server: matches "cron job or HTTP request" from the brief and keeps the read path (backend/frontend) decoupled from platform fetch failures. Also added a thin HTTP trigger (`POST /run`) exposing the exact same `runOnce()` logic, so it's genuinely runnable either way rather than just documented as a future option.
- **SQLite**: zero-config, file-based, good enough to demonstrate the data model without provisioning infrastructure.
- **Express** over Fastify/NestJS: minimal ceremony for a small read API.
- **Mermaid C4** diagrams: render directly in GitHub's markdown preview, no extra tooling needed to review.

## What was rejected
- Turborepo/Nx — unnecessary orchestration overhead for three small apps.
- Postgres via Docker — more realistic for production but adds setup friction that doesn't change what's being assessed.

## Where the brief was ambiguous or in tension with itself
- **"Expected opening hours... for the current day" doesn't say how to represent a shift crossing midnight.** I treated a "today" record as the shift that starts today and can bleed into the early hours of tomorrow (e.g. `11:00`-`01:00` is open right up to and past midnight), because that's what an ops person actually wants to see and it's the only reading that can satisfy the brief's own midnight-crossing requirement. A stricter reading (cap "today" at 23:59, treat 00:00-01:00 as belonging to yesterday's fetch) is defensible too — flagging the ambiguity rather than silently picking one.
- **"No auth" vs. "extract actual availability + hours" is a real tension for modern delivery platforms.** Deliveroo's listing pages are client-rendered (confirmed: the page loads but the useful data isn't in the initial HTML) and return 403 to plain server-side fetches for individual restaurant pages. The brief explicitly anticipates this and green-lights a fixture fallback — I used that escape hatch rather than spending budget on headless-browser scraping or anti-bot workarounds, per the brief's own instruction not to fight it. Worth being upfront that "the pipeline always falls back to fixture" in this submission, not "usually."
- **The 5 real Deliveroo listings you provided don't have verified opening hours** — I can't reach their pages to scrape real hours (403s), so the fixture's opening hours are my placeholder assumptions (Camden set to `11:00`-`01:00` specifically to satisfy the midnight-crossing requirement), not real data. Flagged in code comments (`restaurants.ts`) and here rather than presenting fabricated hours as if they were real.

## What was deliberately cut for time
- **Retry/backoff on transient live-fetch failures** — currently any live-fetch error (network blip or genuine block) falls straight through to the fixture. Fine for this demo since the block is permanent (403/client-rendering), but a real pipeline should distinguish "retry-worthy" from "permanently blocked."
- **Staleness detection/alerting** — the dashboard trusts the latest snapshot regardless of age. A silently-failing pipeline for one restaurant looks identical to a healthy one. Called out as a gap in `docs/architecture.md`'s resilience section rather than patched under time pressure.
- **A working notification demo** (Slack/email webhook) — designed in the architecture doc but not built; would want to prove the write-time-mismatch-detection idea with even a toy webhook given another pass.
- **Per-restaurant time zones** — `computeExpectedState` assumes the comparison happens in the restaurant's local time zone already; there's no actual time zone conversion. Fine for 5 UK branches, not fine at scale across regions.
- **Auth on the dashboard/API** — none. Acceptable for a local demo, not for a real ops tool.
- **Real, verified opening hours** for the 5 listings (see ambiguity note above).

## What I'd do differently with another day
- Attempt a real headless-browser fetch (Playwright) against one Deliveroo listing as a time-boxed spike, to see whether even one branch could plausibly return live data instead of 100% fixture — useful evidence either way for the cost/architecture discussion.
- Move mismatch detection to write-time in the worker and wire up one real notification channel end-to-end (even a Slack incoming webhook), rather than only describing it.
- Add a staleness indicator to the dashboard ("last checked N minutes ago", flagged if stale).
- Swap SQLite for Postgres via docker-compose, to make the follow-up discussion about scaling less hypothetical.

## Time spent
~3.5 hours as of the last check-in during this session, plus the additional iterations after that (backend HTTP trigger, architecture doc, this log, README polish) — will confirm the final total honestly at submission time rather than estimate it here.

# Decision log

## Significant choices
- **Wolt** as the delivery platform, after evaluating Deliveroo first: Deliveroo's individual listing pages are client-rendered and return 403 to server-side fetches (confirmed by testing), whereas Wolt's public restaurant-discovery endpoint (`restaurant-api.wolt.com/v1/pages/restaurants?lat=..&lon=..`) returns real, unauthenticated JSON with a live `online` (accepting-orders) field per venue, verified against 11 real Helsinki McDonald's branches. This is a genuinely live signal, not a rendered page we'd have to scrape.
- **npm workspaces**, no Turborepo/Nx: keeps the monorepo simple for a ~4-hour scope; `apps/frontend`, `apps/backend`, `apps/worker` each start independently, `packages/shared` holds cross-app types.
- **Worker as a one-shot CLI**, not a server: matches "cron job or HTTP request" from the brief and keeps the read path (backend/frontend) decoupled from platform fetch failures. Also added a thin HTTP trigger (`POST /run`) exposing the exact same `runOnce()` logic, so it's genuinely runnable either way rather than just documented as a future option.
- **SQLite**: zero-config, file-based, good enough to demonstrate the data model without provisioning infrastructure.
- **Express** over Fastify/NestJS: minimal ceremony for a small read API.
- **Mermaid C4** diagrams: render directly in GitHub's markdown preview, no extra tooling needed to review.

## What was rejected
- Turborepo/Nx — unnecessary orchestration overhead for three small apps.
- Postgres via Docker — more realistic for production but adds setup friction that doesn't change what's being assessed.

## Where the brief was ambiguous or in tension with itself
- **"Expected opening hours... for the current day" doesn't say how to represent a shift crossing midnight.** I treated a "today" record as the shift that starts today and can bleed into the early hours of tomorrow (e.g. `10:00`-`01:00` is open right up to and past midnight), because that's what an ops person actually wants to see and it's the only reading that can satisfy the brief's own midnight-crossing requirement. A stricter reading (cap "today" at 23:59, treat 00:00-01:00 as belonging to yesterday's fetch) is defensible too — flagging the ambiguity rather than silently picking one.
- **"No auth" vs. "extract actual availability + hours" is a real tension for modern delivery platforms — but not a universal one.** Deliveroo's listing pages are client-rendered (confirmed: the page loads but the useful data isn't in the initial HTML) and return 403 to plain server-side fetches for individual restaurant pages. The brief explicitly anticipates this and green-lights a fixture fallback. Rather than stopping there, I checked whether every delivery platform has this problem — Wolt doesn't: its discovery API is plain, unauthenticated JSON with no bot protection encountered. So the pipeline's `actualState` is genuinely live; only `expectedHoursToday` still comes from a fixture, since I couldn't confirm Wolt's opening-hours endpoint within a reasonable time-box (tried ~10 plausible URL patterns; the discovery payload itself doesn't include hours).
- **The fixture opening hours are still placeholder assumptions, not scraped data** — Töölö is set to `10:00`-`01:00` specifically to satisfy the midnight-crossing requirement. Flagged in code comments (`restaurants.ts`, `fixtures/wolt-listings.json`) and here rather than presenting fabricated hours as if they were real.
- **Stale rows on restaurant-list changes**: switching the tracked restaurant list (Deliveroo → Wolt) left the old Deliveroo rows in `restaurants`/`availability_snapshots` (upserts never delete). Harmless for a demo (worked around by wiping the local dev DB), but a real system would need an explicit "retire a tracked restaurant" path.

## What was deliberately cut for time
- **Wolt's opening-hours endpoint** — not confirmed; `expectedHoursToday` is still fixture data layered on top of the live `online` status. Would need a real browser network trace (not blind URL-pattern guessing) to find it properly.
- **Retry/backoff on transient live-fetch failures** — a discovery-fetch error currently falls straight through to fixture for every restaurant in that run. Fine for this demo; a real pipeline should distinguish "retry-worthy" (network blip) from "permanently unavailable."
- **Staleness detection/alerting** — the dashboard trusts the latest snapshot regardless of age. A silently-failing pipeline for one restaurant looks identical to a healthy one. Called out as a gap in `docs/architecture.md`'s resilience section rather than patched under time pressure.
- **A working notification demo** (Slack/email webhook) — designed in the architecture doc but not built; would want to prove the write-time-mismatch-detection idea with even a toy webhook given another pass.
- **Per-restaurant time zones** — `computeExpectedState` assumes the comparison happens in the restaurant's local time zone already; there's no actual time zone conversion. Fine for 5 Helsinki branches on one server clock, not fine at scale across regions.
- **Auth on the dashboard/API** — none. Acceptable for a local demo, not for a real ops tool.
- **Cleanup of retired restaurants** — see the stale-rows note above.

## What I'd do differently with another day
- Find Wolt's real per-venue opening-hours endpoint properly (browser devtools network trace rather than blind URL guessing), to make `expectedHoursToday` fully live too.
- Move mismatch detection to write-time in the worker and wire up one real notification channel end-to-end (even a Slack incoming webhook), rather than only describing it.
- Add a staleness indicator to the dashboard ("last checked N minutes ago", flagged if stale).
- Swap SQLite for Postgres via docker-compose, to make the follow-up discussion about scaling less hypothetical.

## Time spent
~3.5 hours as of the last check-in during this session, plus the additional iterations after that (backend HTTP trigger, architecture doc, this log, README polish) — will confirm the final total honestly at submission time rather than estimate it here.

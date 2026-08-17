import { runOnce } from "./runOnce.js";

// One-shot CLI entrypoint: intended to be invoked by cron, not left running.
async function run(): Promise<void> {
  console.log("pipeline run started", new Date().toISOString());
  const summary = await runOnce();
  console.log(`pipeline run finished: ${summary.ok}/${summary.results.length} ok`, summary.bySource);
  for (const failure of summary.results.filter((r) => !r.ok)) {
    console.error(`  FAILED ${failure.restaurantId}: ${failure.error}`);
  }
  if (summary.failed === summary.results.length && summary.results.length > 0) {
    process.exitCode = 1;
  }
}

run().catch((err) => {
  console.error("pipeline run failed", err);
  process.exitCode = 1;
});


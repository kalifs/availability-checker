import { openDb } from "@monitor/shared";
import { fileURLToPath } from "node:url";
import { runPipeline } from "./pipeline.js";
import { restaurants } from "./restaurants.js";

const DB_PATH = process.env.MONITOR_DB_PATH ?? fileURLToPath(new URL("../../../data/monitor.sqlite", import.meta.url));

// One-shot CLI entrypoint: intended to be invoked by cron / a scheduled HTTP trigger, not left running.
async function run(): Promise<void> {
  console.log("pipeline run started", new Date().toISOString(), "db:", DB_PATH);
  const db = openDb(DB_PATH);
  try {
    const results = await runPipeline(db, restaurants);
    const failed = results.filter((r) => !r.ok);
    const bySource = { live: 0, fixture: 0 };
    for (const r of results) {
      if (r.ok && r.source) bySource[r.source]++;
    }
    console.log(`pipeline run finished: ${results.length - failed.length}/${results.length} ok`, bySource);
    for (const failure of failed) {
      console.error(`  FAILED ${failure.restaurantId}: ${failure.error}`);
    }
    if (failed.length === results.length) {
      process.exitCode = 1;
    }
  } finally {
    db.close();
  }
}

run().catch((err) => {
  console.error("pipeline run failed", err);
  process.exitCode = 1;
});

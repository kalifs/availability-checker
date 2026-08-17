import { openDb } from "@monitor/shared";
import { fileURLToPath } from "node:url";
import { runPipeline, type ListingResult } from "./pipeline.js";
import { restaurants } from "./restaurants.js";

export const DB_PATH = process.env.MONITOR_DB_PATH ?? fileURLToPath(new URL("../../../data/monitor.sqlite", import.meta.url));

export interface RunSummary {
  startedAt: string;
  ok: number;
  failed: number;
  bySource: { live: number; fixture: number };
  results: ListingResult[];
}

/** Runs the pipeline once against the given DB path and returns a summary — shared by the CLI and HTTP entrypoints. */
export async function runOnce(dbPath: string = DB_PATH): Promise<RunSummary> {
  const startedAt = new Date().toISOString();
  const db = openDb(dbPath);
  try {
    const results = await runPipeline(db, restaurants);
    const failed = results.filter((r) => !r.ok);
    const bySource = { live: 0, fixture: 0 };
    for (const r of results) {
      if (r.ok && r.source) bySource[r.source]++;
    }
    return { startedAt, ok: results.length - failed.length, failed: failed.length, bySource, results };
  } finally {
    db.close();
  }
}

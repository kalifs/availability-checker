import { computeExpectedState, getRestaurantsWithLatestSnapshot, openDb, type RestaurantStatus } from "@monitor/shared";
import cors from "cors";
import express from "express";
import { fileURLToPath } from "node:url";

const DB_PATH = process.env.MONITOR_DB_PATH ?? fileURLToPath(new URL("../../../data/monitor.sqlite", import.meta.url));
const db = openDb(DB_PATH);

const app = express();
const port = process.env.PORT ?? 3001;

app.use(cors());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/restaurants", (_req, res) => {
  const now = new Date();
  const restaurants: RestaurantStatus[] = getRestaurantsWithLatestSnapshot(db).map((restaurant) => {
    const snapshot = restaurant.latestSnapshot;
    const expectedState = snapshot ? computeExpectedState(snapshot.expectedHoursToday, now) : null;
    const actualState = snapshot?.actualState ?? null;
    const mismatch =
      expectedState !== null &&
      actualState !== null &&
      ((expectedState === "expected-open" && actualState === "unavailable") ||
        (expectedState === "expected-closed" && actualState === "available"));

    return {
      id: restaurant.id,
      chain: restaurant.chain,
      name: restaurant.name,
      branch: restaurant.branch,
      platformUrl: restaurant.platformUrl,
      actualState,
      expectedState,
      mismatch,
      lastFetchedAt: snapshot?.fetchedAt ?? null,
      source: snapshot?.source ?? null,
    };
  });

  res.json({ generatedAt: now.toISOString(), restaurants });
});

app.listen(port, () => {
  console.log(`backend listening on http://localhost:${port}`);
});

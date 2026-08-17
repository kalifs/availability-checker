import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { AvailabilitySnapshot, RestaurantListing } from "./types.js";

export function openDb(path: string): Database.Database {
  mkdirSync(dirname(path), { recursive: true });
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  createSchema(db);
  return db;
}

function createSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      chain TEXT NOT NULL,
      name TEXT NOT NULL,
      branch TEXT NOT NULL,
      platform_url TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS availability_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
      fetched_at TEXT NOT NULL,
      actual_state TEXT NOT NULL,
      expected_hours_today TEXT NOT NULL,
      source TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_restaurant_fetched_at
      ON availability_snapshots (restaurant_id, fetched_at DESC);
  `);
}

export function upsertRestaurant(db: Database.Database, restaurant: RestaurantListing): void {
  db.prepare(
    `INSERT INTO restaurants (id, chain, name, branch, platform_url)
     VALUES (@id, @chain, @name, @branch, @platformUrl)
     ON CONFLICT(id) DO UPDATE SET
       chain = excluded.chain,
       name = excluded.name,
       branch = excluded.branch,
       platform_url = excluded.platform_url`,
  ).run(restaurant);
}

export function insertSnapshot(db: Database.Database, snapshot: AvailabilitySnapshot): void {
  db.prepare(
    `INSERT INTO availability_snapshots (restaurant_id, fetched_at, actual_state, expected_hours_today, source)
     VALUES (@restaurantId, @fetchedAt, @actualState, @expectedHoursToday, @source)`,
  ).run({
    restaurantId: snapshot.restaurantId,
    fetchedAt: snapshot.fetchedAt,
    actualState: snapshot.actualState,
    expectedHoursToday: JSON.stringify(snapshot.expectedHoursToday),
    source: snapshot.source,
  });
}

export interface RestaurantWithLatestSnapshot extends RestaurantListing {
  latestSnapshot: AvailabilitySnapshot | null;
}

/** One row per restaurant, joined with its most recent snapshot (if any) — used by the backend API. */
export function getRestaurantsWithLatestSnapshot(db: Database.Database): RestaurantWithLatestSnapshot[] {
  const rows = db
    .prepare(
      `SELECT
         r.id, r.chain, r.name, r.branch, r.platform_url AS platformUrl,
         s.fetched_at AS fetchedAt, s.actual_state AS actualState,
         s.expected_hours_today AS expectedHoursToday, s.source
       FROM restaurants r
       LEFT JOIN availability_snapshots s
         ON s.id = (
           SELECT id FROM availability_snapshots
           WHERE restaurant_id = r.id
           ORDER BY fetched_at DESC
           LIMIT 1
         )
       ORDER BY r.chain, r.branch`,
    )
    .all() as Array<{
    id: string;
    chain: string;
    name: string;
    branch: string;
    platformUrl: string;
    fetchedAt: string | null;
    actualState: AvailabilitySnapshot["actualState"] | null;
    expectedHoursToday: string | null;
    source: AvailabilitySnapshot["source"] | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    chain: row.chain,
    name: row.name,
    branch: row.branch,
    platformUrl: row.platformUrl,
    latestSnapshot:
      row.fetchedAt && row.actualState && row.expectedHoursToday && row.source
        ? {
            restaurantId: row.id,
            fetchedAt: row.fetchedAt,
            actualState: row.actualState,
            expectedHoursToday: JSON.parse(row.expectedHoursToday),
            source: row.source,
          }
        : null,
  }));
}

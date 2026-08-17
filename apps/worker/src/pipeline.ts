import { insertSnapshot, upsertRestaurant, type AvailabilitySnapshot, type RestaurantListing, type SnapshotSource } from "@monitor/shared";
import type Database from "better-sqlite3";
import { fetchLiveListing } from "./fetchLive.js";
import { getFixtureListing } from "./fixtureSource.js";
import { normalizeListing } from "./normalize.js";
import { parseDeliverooHtml } from "./parseDeliveroo.js";

export interface ListingResult {
  restaurantId: string;
  ok: boolean;
  source?: SnapshotSource;
  error?: string;
}

/** Fetches (live, falling back to fixture), normalizes, and persists a snapshot for one restaurant. */
async function processRestaurant(db: Database.Database, restaurant: RestaurantListing): Promise<ListingResult> {
  upsertRestaurant(db, restaurant);
  const fetchedAt = new Date().toISOString();

  let source: SnapshotSource;
  let raw;
  try {
    const live = await fetchLiveListing(restaurant.platformUrl);
    raw = parseDeliverooHtml(live.html, restaurant.id);
    source = "live";
  } catch (liveError) {
    try {
      raw = getFixtureListing(restaurant.id);
      source = "fixture";
    } catch (fixtureError) {
      const reason = fixtureError instanceof Error ? fixtureError.message : String(fixtureError);
      return { restaurantId: restaurant.id, ok: false, error: `no live data and no fixture: ${reason}` };
    }
  }

  let snapshot: AvailabilitySnapshot;
  try {
    snapshot = normalizeListing(raw, source, fetchedAt);
  } catch (normalizeError) {
    const reason = normalizeError instanceof Error ? normalizeError.message : String(normalizeError);
    return { restaurantId: restaurant.id, ok: false, source, error: reason };
  }

  insertSnapshot(db, snapshot);
  return { restaurantId: restaurant.id, ok: true, source };
}

export async function runPipeline(db: Database.Database, restaurants: RestaurantListing[]): Promise<ListingResult[]> {
  const results: ListingResult[] = [];
  for (const restaurant of restaurants) {
    results.push(await processRestaurant(db, restaurant));
  }
  return results;
}

import { insertSnapshot, upsertRestaurant, type AvailabilitySnapshot, type RestaurantListing, type SnapshotSource } from "@monitor/shared";
import type Database from "better-sqlite3";
import { getFixtureListing } from "./fixtureSource.js";
import { normalizeListing } from "./normalize.js";
import { WOLT_DISCOVERY_COORDS } from "./restaurants.js";
import { fetchWoltDiscovery, type WoltVenueStatus } from "./wolt.js";

export interface ListingResult {
  restaurantId: string;
  ok: boolean;
  source?: SnapshotSource;
  error?: string;
}

/**
 * Builds a snapshot for one restaurant: live `online` status (if the discovery fetch
 * succeeded and this venue was in range) combined with fixture opening hours, since
 * Wolt's public discovery endpoint doesn't expose hours. Falls back to a fully-fixture
 * snapshot if live status isn't available for this restaurant.
 */
function processRestaurant(
  db: Database.Database,
  restaurant: RestaurantListing,
  liveStatuses: Map<string, WoltVenueStatus> | null,
  fetchedAt: string,
): ListingResult {
  upsertRestaurant(db, restaurant);

  let fixture;
  try {
    fixture = getFixtureListing(restaurant.id);
  } catch (fixtureError) {
    const reason = fixtureError instanceof Error ? fixtureError.message : String(fixtureError);
    return { restaurantId: restaurant.id, ok: false, error: `no fixture for opening hours: ${reason}` };
  }

  const live = liveStatuses?.get(restaurant.id);
  const source: SnapshotSource = live ? "live" : "fixture";
  const raw = {
    restaurantId: restaurant.id,
    isAcceptingOrders: live ? live.online : fixture.isAcceptingOrders,
    openingHoursToday: fixture.openingHoursToday,
  };

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
  const fetchedAt = new Date().toISOString();

  let liveStatuses: Map<string, WoltVenueStatus> | null = null;
  try {
    liveStatuses = await fetchWoltDiscovery(WOLT_DISCOVERY_COORDS.lat, WOLT_DISCOVERY_COORDS.lon);
  } catch {
    liveStatuses = null; // whole-city fetch failed; every restaurant falls back to its fixture below
  }

  return restaurants.map((restaurant) => processRestaurant(db, restaurant, liveStatuses, fetchedAt));
}

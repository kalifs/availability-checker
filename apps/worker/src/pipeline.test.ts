import { getRestaurantsWithLatestSnapshot, openDb, type RestaurantListing } from "@monitor/shared";
import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFixtureListing } from "./fixtureSource.js";
import { runPipeline } from "./pipeline.js";
import { fetchWoltDiscovery } from "./wolt.js";

vi.mock("./wolt.js", () => ({ fetchWoltDiscovery: vi.fn() }));
vi.mock("./fixtureSource.js", () => ({ getFixtureListing: vi.fn() }));

const restaurant: RestaurantListing = {
  id: "r1",
  chain: "TestChain",
  name: "TestChain",
  branch: "Test Branch",
  platformUrl: "https://example.test/r1",
};

let db: Database.Database;

beforeEach(() => {
  db = openDb(":memory:");
  vi.mocked(fetchWoltDiscovery).mockReset();
  vi.mocked(getFixtureListing).mockReset();
});

describe("runPipeline", () => {
  it("uses the live online status, combined with fixture hours, when discovery succeeds", async () => {
    vi.mocked(fetchWoltDiscovery).mockResolvedValue(new Map([["r1", { online: true }]]));
    vi.mocked(getFixtureListing).mockReturnValue({
      restaurantId: "r1",
      isAcceptingOrders: false, // deliberately different from the live value, to prove live wins
      openingHoursToday: [{ start: "11:00", end: "23:00" }],
    });

    const results = await runPipeline(db, [restaurant]);

    expect(results).toEqual([{ restaurantId: "r1", ok: true, source: "live" }]);
    const rows = getRestaurantsWithLatestSnapshot(db);
    expect(rows[0].latestSnapshot).toMatchObject({ source: "live", actualState: "available" });
  });

  it("falls back to a fully-fixture snapshot when discovery fails entirely", async () => {
    vi.mocked(fetchWoltDiscovery).mockRejectedValue(new Error("network error"));
    vi.mocked(getFixtureListing).mockReturnValue({
      restaurantId: "r1",
      isAcceptingOrders: false,
      openingHoursToday: [{ start: "11:00", end: "01:00" }],
    });

    const results = await runPipeline(db, [restaurant]);

    expect(results).toEqual([{ restaurantId: "r1", ok: true, source: "fixture" }]);
    const rows = getRestaurantsWithLatestSnapshot(db);
    expect(rows[0].latestSnapshot).toMatchObject({ source: "fixture", actualState: "unavailable" });
  });

  it("falls back to fixture for a restaurant discovery didn't return (out of range)", async () => {
    vi.mocked(fetchWoltDiscovery).mockResolvedValue(new Map()); // succeeded, but no match for "r1"
    vi.mocked(getFixtureListing).mockReturnValue({
      restaurantId: "r1",
      isAcceptingOrders: true,
      openingHoursToday: [{ start: "11:00", end: "23:00" }],
    });

    const results = await runPipeline(db, [restaurant]);

    expect(results).toEqual([{ restaurantId: "r1", ok: true, source: "fixture" }]);
  });

  it("reports failure without persisting when there's no fixture for opening hours", async () => {
    vi.mocked(fetchWoltDiscovery).mockResolvedValue(new Map([["r1", { online: true }]]));
    vi.mocked(getFixtureListing).mockImplementation(() => {
      throw new Error("no fixture recorded for r1");
    });

    const results = await runPipeline(db, [restaurant]);

    expect(results).toEqual([
      { restaurantId: "r1", ok: false, error: expect.stringContaining("no fixture recorded for r1") },
    ]);
    const rows = getRestaurantsWithLatestSnapshot(db);
    expect(rows[0].latestSnapshot).toBeNull();
  });

  it("reports failure without persisting when the fixture's opening hours are malformed", async () => {
    vi.mocked(fetchWoltDiscovery).mockResolvedValue(new Map([["r1", { online: true }]]));
    vi.mocked(getFixtureListing).mockReturnValue({
      restaurantId: "r1",
      isAcceptingOrders: true,
      openingHoursToday: [],
    });

    const results = await runPipeline(db, [restaurant]);

    expect(results).toEqual([
      { restaurantId: "r1", ok: false, source: "live", error: expect.stringContaining("openingHoursToday") },
    ]);
    const rows = getRestaurantsWithLatestSnapshot(db);
    expect(rows[0].latestSnapshot).toBeNull();
  });

  it("keeps processing remaining restaurants after one fails", async () => {
    const restaurant2: RestaurantListing = { ...restaurant, id: "r2", branch: "Branch 2" };
    vi.mocked(fetchWoltDiscovery).mockResolvedValue(new Map([["r2", { online: true }]]));
    vi.mocked(getFixtureListing).mockImplementation((id: string) => {
      if (id === "r1") throw new Error("no fixture recorded for r1");
      return { restaurantId: "r2", isAcceptingOrders: true, openingHoursToday: [{ start: "11:00", end: "23:00" }] };
    });

    const results = await runPipeline(db, [restaurant, restaurant2]);

    expect(results.map((r) => r.restaurantId)).toEqual(["r1", "r2"]);
    expect(results[0].ok).toBe(false);
    expect(results[1]).toEqual({ restaurantId: "r2", ok: true, source: "live" });
  });
});

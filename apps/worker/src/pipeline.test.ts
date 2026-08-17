import { getRestaurantsWithLatestSnapshot, openDb, type RestaurantListing } from "@monitor/shared";
import type Database from "better-sqlite3";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchLiveListing } from "./fetchLive.js";
import { getFixtureListing } from "./fixtureSource.js";
import { parseDeliverooHtml } from "./parseDeliveroo.js";
import { runPipeline } from "./pipeline.js";

vi.mock("./fetchLive.js", () => ({ fetchLiveListing: vi.fn() }));
vi.mock("./parseDeliveroo.js", () => ({ parseDeliverooHtml: vi.fn() }));
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
  vi.mocked(fetchLiveListing).mockReset();
  vi.mocked(parseDeliverooHtml).mockReset();
  vi.mocked(getFixtureListing).mockReset();
});

describe("runPipeline", () => {
  it("persists a live snapshot when the live fetch and parse succeed", async () => {
    vi.mocked(fetchLiveListing).mockResolvedValue({ status: 200, html: "<html></html>" });
    vi.mocked(parseDeliverooHtml).mockReturnValue({
      restaurantId: "r1",
      isAcceptingOrders: true,
      openingHoursToday: [{ start: "11:00", end: "23:00" }],
    });

    const results = await runPipeline(db, [restaurant]);

    expect(results).toEqual([{ restaurantId: "r1", ok: true, source: "live" }]);
    expect(getFixtureListing).not.toHaveBeenCalled();
    const rows = getRestaurantsWithLatestSnapshot(db);
    expect(rows[0].latestSnapshot?.source).toBe("live");
  });

  it("falls back to the fixture when the live fetch throws", async () => {
    vi.mocked(fetchLiveListing).mockRejectedValue(new Error("network error"));
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

  it("falls back to the fixture when parsing the live response throws", async () => {
    vi.mocked(fetchLiveListing).mockResolvedValue({ status: 200, html: "<html></html>" });
    vi.mocked(parseDeliverooHtml).mockImplementation(() => {
      throw new Error("no JSON-LD block found");
    });
    vi.mocked(getFixtureListing).mockReturnValue({
      restaurantId: "r1",
      isAcceptingOrders: true,
      openingHoursToday: [{ start: "11:00", end: "23:00" }],
    });

    const results = await runPipeline(db, [restaurant]);

    expect(results).toEqual([{ restaurantId: "r1", ok: true, source: "fixture" }]);
  });

  it("reports failure without persisting when both live and fixture fail", async () => {
    vi.mocked(fetchLiveListing).mockRejectedValue(new Error("network error"));
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

  it("reports failure without persisting when the fixture data is malformed", async () => {
    vi.mocked(fetchLiveListing).mockRejectedValue(new Error("network error"));
    vi.mocked(getFixtureListing).mockReturnValue({
      restaurantId: "r1",
      isAcceptingOrders: true,
      openingHoursToday: [],
    });

    const results = await runPipeline(db, [restaurant]);

    expect(results).toEqual([
      { restaurantId: "r1", ok: false, source: "fixture", error: expect.stringContaining("openingHoursToday") },
    ]);
    const rows = getRestaurantsWithLatestSnapshot(db);
    expect(rows[0].latestSnapshot).toBeNull();
  });

  it("keeps processing remaining restaurants after one fails", async () => {
    const restaurant2: RestaurantListing = { ...restaurant, id: "r2", branch: "Branch 2" };
    vi.mocked(fetchLiveListing).mockRejectedValue(new Error("network error"));
    vi.mocked(getFixtureListing).mockImplementation((id: string) => {
      if (id === "r1") throw new Error("no fixture recorded for r1");
      return { restaurantId: "r2", isAcceptingOrders: true, openingHoursToday: [{ start: "11:00", end: "23:00" }] };
    });

    const results = await runPipeline(db, [restaurant, restaurant2]);

    expect(results.map((r) => r.restaurantId)).toEqual(["r1", "r2"]);
    expect(results[0].ok).toBe(false);
    expect(results[1]).toEqual({ restaurantId: "r2", ok: true, source: "fixture" });
  });
});

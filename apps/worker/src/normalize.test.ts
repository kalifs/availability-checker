import { MalformedListingError } from "@monitor/shared";
import { describe, expect, it } from "vitest";
import { normalizeListing } from "./normalize.js";

const FETCHED_AT = "2026-01-01T12:00:00.000Z";

describe("normalizeListing", () => {
  it("maps a valid raw listing to an availability snapshot", () => {
    const snapshot = normalizeListing(
      { restaurantId: "r1", isAcceptingOrders: true, openingHoursToday: [{ start: "11:00", end: "23:00" }] },
      "fixture",
      FETCHED_AT,
    );
    expect(snapshot).toEqual({
      restaurantId: "r1",
      fetchedAt: FETCHED_AT,
      actualState: "available",
      expectedHoursToday: [{ start: "11:00", end: "23:00" }],
      source: "fixture",
    });
  });

  it("maps isAcceptingOrders: false to unavailable", () => {
    const snapshot = normalizeListing(
      { restaurantId: "r1", isAcceptingOrders: false, openingHoursToday: [{ start: "11:00", end: "23:00" }] },
      "live",
      FETCHED_AT,
    );
    expect(snapshot.actualState).toBe("unavailable");
  });

  it("preserves a midnight-crossing interval unchanged", () => {
    const snapshot = normalizeListing(
      { restaurantId: "r1", isAcceptingOrders: true, openingHoursToday: [{ start: "11:00", end: "01:00" }] },
      "fixture",
      FETCHED_AT,
    );
    expect(snapshot.expectedHoursToday).toEqual([{ start: "11:00", end: "01:00" }]);
  });

  it("rejects an empty openingHoursToday", () => {
    expect(() =>
      normalizeListing({ restaurantId: "r1", isAcceptingOrders: true, openingHoursToday: [] }, "fixture", FETCHED_AT),
    ).toThrow(MalformedListingError);
  });

  it("rejects a malformed time string", () => {
    expect(() =>
      normalizeListing(
        { restaurantId: "r1", isAcceptingOrders: true, openingHoursToday: [{ start: "11am", end: "23:00" }] },
        "fixture",
        FETCHED_AT,
      ),
    ).toThrow(MalformedListingError);
  });

  it("rejects an out-of-range time string", () => {
    expect(() =>
      normalizeListing(
        { restaurantId: "r1", isAcceptingOrders: true, openingHoursToday: [{ start: "24:00", end: "23:00" }] },
        "fixture",
        FETCHED_AT,
      ),
    ).toThrow(MalformedListingError);
  });

  it("rejects a non-boolean isAcceptingOrders", () => {
    expect(() =>
      normalizeListing(
        // @ts-expect-error deliberately malformed input to test runtime validation
        { restaurantId: "r1", isAcceptingOrders: "yes", openingHoursToday: [{ start: "11:00", end: "23:00" }] },
        "fixture",
        FETCHED_AT,
      ),
    ).toThrow(MalformedListingError);
  });
});

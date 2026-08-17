import { MalformedListingError, type AvailabilitySnapshot, type RawListing, type SnapshotSource } from "@monitor/shared";

export function normalizeListing(raw: RawListing, source: SnapshotSource, fetchedAt: string): AvailabilitySnapshot {
  if (!Array.isArray(raw.openingHoursToday) || raw.openingHoursToday.length === 0) {
    throw new MalformedListingError(raw.restaurantId, "missing or empty openingHoursToday");
  }
  for (const interval of raw.openingHoursToday) {
    if (!isHHmm(interval.start) || !isHHmm(interval.end)) {
      throw new MalformedListingError(
        raw.restaurantId,
        `opening hours interval is not in HH:mm form: ${JSON.stringify(interval)}`,
      );
    }
  }
  if (typeof raw.isAcceptingOrders !== "boolean") {
    throw new MalformedListingError(raw.restaurantId, "missing or non-boolean isAcceptingOrders");
  }

  return {
    restaurantId: raw.restaurantId,
    fetchedAt,
    actualState: raw.isAcceptingOrders ? "available" : "unavailable",
    expectedHoursToday: raw.openingHoursToday,
    source,
  };
}

function isHHmm(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

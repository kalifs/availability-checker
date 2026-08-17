export interface OpeningHoursInterval {
  /** 24h "HH:mm" local to the restaurant, may roll past midnight (e.g. start "18:00", end "01:00"). */
  start: string;
  end: string;
}

export interface RestaurantListing {
  id: string;
  chain: string;
  name: string;
  branch: string;
  platformUrl: string;
}

export type AvailabilityState = "available" | "unavailable";

/** Where a snapshot's data came from — kept for observability, since fixtures stand in when the platform blocks us. */
export type SnapshotSource = "live" | "fixture";

export interface AvailabilitySnapshot {
  restaurantId: string;
  fetchedAt: string;
  actualState: AvailabilityState;
  expectedHoursToday: OpeningHoursInterval[];
  source: SnapshotSource;
}

/** Shape produced by a listing source (live fetch or fixture) before it is validated/normalized. */
export interface RawListing {
  restaurantId: string;
  isAcceptingOrders: boolean;
  openingHoursToday: OpeningHoursInterval[];
}

export class ListingUnavailableError extends Error {
  constructor(
    public readonly restaurantId: string,
    message: string,
  ) {
    super(message);
    this.name = "ListingUnavailableError";
  }
}

export class MalformedListingError extends Error {
  constructor(
    public readonly restaurantId: string,
    message: string,
  ) {
    super(message);
    this.name = "MalformedListingError";
  }
}

/** Shape served by the backend API and consumed by the frontend dashboard. */
export interface RestaurantStatus {
  id: string;
  chain: string;
  name: string;
  branch: string;
  platformUrl: string;
  actualState: AvailabilityState | null;
  expectedState: "expected-open" | "expected-closed" | null;
  mismatch: boolean;
  lastFetchedAt: string | null;
  source: SnapshotSource | null;
}

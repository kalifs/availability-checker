// Placeholder shapes; refined in Iteration 2 (pipeline) and Iteration 3 (API).

export interface OpeningHoursInterval {
  /** 24h "HH:mm" local to the restaurant, may roll past midnight (e.g. start "18:00", end "01:00"). */
  start: string;
  end: string;
}

export interface RestaurantListing {
  id: string;
  name: string;
  branch: string;
  platformUrl: string;
}

export type AvailabilityState = "available" | "unavailable";

export interface AvailabilitySnapshot {
  restaurantId: string;
  fetchedAt: string;
  actualState: AvailabilityState;
  expectedHoursToday: OpeningHoursInterval[];
}

import type { RestaurantStatus } from "@monitor/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export interface RestaurantsResponse {
  generatedAt: string;
  restaurants: RestaurantStatus[];
}

export async function fetchRestaurants(): Promise<RestaurantsResponse> {
  const res = await fetch(`${API_BASE_URL}/restaurants`);
  if (!res.ok) {
    throw new Error(`backend returned ${res.status}`);
  }
  return res.json();
}

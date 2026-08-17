import type { RestaurantListing } from "@monitor/shared";

/**
 * Real, live Wolt (Helsinki) listings verified via the public discovery API
 * (https://restaurant-api.wolt.com/v1/pages/restaurants) — no auth, no bot protection.
 * That endpoint returns live `online` status for every venue, which the pipeline uses
 * directly for `actualState`. It does NOT expose opening hours, so `expectedHoursToday`
 * still comes from the recorded fixture (fixtures/wolt-listings.json) — Töölö is set to
 * cross midnight there to satisfy the brief's requirement.
 */
export const WOLT_DISCOVERY_COORDS = { lat: 60.1699, lon: 24.9384 }; // central Helsinki

export const restaurants: RestaurantListing[] = [
  {
    id: "5ae605a7349077000b1f5ef4",
    chain: "McDonald's",
    name: "McDonald's",
    branch: "Helsinki Forum Katutaso",
    platformUrl: "https://wolt.com/en/fin/helsinki/restaurant/mcdonalds-forum-katutaso",
  },
  {
    id: "5ae6013cf78b5a000bb64022",
    chain: "McDonald's",
    name: "McDonald's",
    branch: "Helsinki Kamppi",
    platformUrl: "https://wolt.com/en/fin/helsinki/restaurant/mcdonalds-kamppi-1",
  },
  {
    id: "68dceacd048dce1b6a99ecd8",
    chain: "McDonald's",
    name: "McDonald's",
    branch: "Helsinki Jätkäsaari",
    platformUrl: "https://wolt.com/en/fin/helsinki/restaurant/mcdonalds-jatkasaari",
  },
  {
    id: "62e26f2ecf2836517a0b1141",
    chain: "McDonald's",
    name: "McDonald's",
    branch: "Helsinki Hakaniemi",
    platformUrl: "https://wolt.com/en/fin/helsinki/restaurant/mcdonalds-helsinki-hakaniemi-uusi",
  },
  {
    id: "664da8e02b117f45247ad49a",
    chain: "McDonald's",
    name: "McDonald's",
    branch: "Helsinki Töölö",
    platformUrl: "https://wolt.com/en/fin/helsinki/restaurant/mcdonalds-toolo",
  },
];


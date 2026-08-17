import type { RestaurantListing } from "@monitor/shared";

/**
 * Real, confirmed-to-exist Deliveroo listings. Their menu pages return 403 to server-side
 * fetches (bot protection), so opening hours below are PLACEHOLDER assumptions, not scraped
 * data — Camden is deliberately modelled as crossing midnight (11:00-01:00) to satisfy the
 * brief's requirement. Replace with real hours once confirmed.
 */

export const restaurants: RestaurantListing[] = [
  {
    id: "mcdonalds-liverpool-street",
    chain: "McDonald's",
    name: "McDonald's",
    branch: "Liverpool Street",
    platformUrl: "https://deliveroo.co.uk/menu/London/liverpool-street/mcdonalds-0444-liverpool-street",
  },
  {
    id: "mcdonalds-camden",
    chain: "McDonald's",
    name: "McDonald's",
    branch: "Camden",
    platformUrl: "https://deliveroo.co.uk/menu/London/camden/mcdonalds-0419-camden",
  },
  {
    id: "mcdonalds-croydon-poppy-ph",
    chain: "McDonald's",
    name: "McDonald's",
    branch: "Croydon - The Poppy PH",
    platformUrl: "https://deliveroo.co.uk/menu/London/shirley-wickham/mcdonalds-1049-croydon-the-poppy-ph/",
  },
  {
    id: "mcdonalds-croydon-swan-close",
    chain: "McDonald's",
    name: "McDonald's",
    branch: "Croydon - Swan Close (delivery kitchen)",
    platformUrl: "https://deliveroo.co.uk/menu/London/selhurst/mcdonalds-1625-croydon-swan-close-delivery-kitchen",
  },
  {
    id: "mcdonalds-manchester-arndale",
    chain: "McDonald's",
    name: "McDonald's",
    branch: "Manchester Arndale",
    platformUrl: "https://deliveroo.co.uk/menu/Manchester/manchester-central/mcdonalds-1120-manchester-arndale-food-chain/",
  },
];


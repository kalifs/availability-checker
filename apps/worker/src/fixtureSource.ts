import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { RawListing } from "@monitor/shared";

const fixturesPath = fileURLToPath(new URL("./fixtures/deliveroo-listings.json", import.meta.url));
const fixtures: Record<string, RawListing> = JSON.parse(readFileSync(fixturesPath, "utf-8"));

export function getFixtureListing(restaurantId: string): RawListing {
  const fixture = fixtures[restaurantId];
  if (!fixture) {
    throw new Error(`no fixture recorded for ${restaurantId}`);
  }
  return fixture;
}

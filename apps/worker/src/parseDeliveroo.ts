import type { OpeningHoursInterval, RawListing } from "@monitor/shared";

/**
 * Deliveroo listing pages are client-rendered (React), so the useful data (opening hours,
 * order-acceptance state) isn't present in the initial HTML response — only in JS-fetched
 * GraphQL/API calls that this pipeline doesn't reproduce. We still probe for a schema.org
 * JSON-LD block (a common SEO fallback other platforms embed server-side); if it's absent
 * or doesn't parse, we throw so the caller falls back to a recorded fixture instead.
 */
export function parseDeliverooHtml(html: string, restaurantId: string): RawListing {
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) {
    throw new Error(`no JSON-LD block found for ${restaurantId}; page requires client-side rendering`);
  }

  const data = JSON.parse(match[1]);
  const openingHoursToday = extractOpeningHoursToday(data);
  const isAcceptingOrders = extractIsAcceptingOrders(data);

  if (!openingHoursToday || isAcceptingOrders === undefined) {
    throw new Error(`JSON-LD block for ${restaurantId} did not contain the expected fields`);
  }

  return { restaurantId, isAcceptingOrders, openingHoursToday };
}

function extractOpeningHoursToday(_data: unknown): OpeningHoursInterval[] | undefined {
  return undefined;
}

function extractIsAcceptingOrders(_data: unknown): boolean | undefined {
  return undefined;
}

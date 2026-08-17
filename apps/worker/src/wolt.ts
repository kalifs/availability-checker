export interface WoltVenueStatus {
  online: boolean;
}

const DISCOVERY_TIMEOUT_MS = 5000;

/**
 * Wolt's public, unauthenticated restaurant-discovery endpoint for a city/area.
 * One call returns live `online` (accepting-orders) status for every venue in range,
 * so the pipeline fetches it once per run rather than once per restaurant.
 */
export async function fetchWoltDiscovery(lat: number, lon: number): Promise<Map<string, WoltVenueStatus>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DISCOVERY_TIMEOUT_MS);
  let body: unknown;
  try {
    const res = await fetch(`https://restaurant-api.wolt.com/v1/pages/restaurants?lat=${lat}&lon=${lon}`, {
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`wolt discovery returned ${res.status}`);
    }
    body = await res.json();
  } finally {
    clearTimeout(timeout);
  }

  return extractVenueStatuses(body);
}

function extractVenueStatuses(body: unknown): Map<string, WoltVenueStatus> {
  const statuses = new Map<string, WoltVenueStatus>();
  const sections = (body as { sections?: unknown[] })?.sections ?? [];
  for (const section of sections) {
    const items = (section as { items?: unknown[] })?.items ?? [];
    for (const item of items) {
      const venue = (item as { venue?: { id?: string; online?: boolean } })?.venue;
      if (venue?.id && typeof venue.online === "boolean") {
        statuses.set(venue.id, { online: venue.online });
      }
    }
  }
  return statuses;
}

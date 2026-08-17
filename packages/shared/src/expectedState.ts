import type { OpeningHoursInterval } from "./types.js";

export type ExpectedAvailability = "expected-open" | "expected-closed";

function toMinutes(hhmm: string): number {
  const [hours, minutes] = hhmm.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Intervals where end <= start are treated as crossing midnight (e.g. "11:00"-"01:00"):
 * open from start to 24:00, and again from 00:00 to end.
 */
function isWithinInterval(interval: OpeningHoursInterval, nowMinutes: number): boolean {
  const start = toMinutes(interval.start);
  const end = toMinutes(interval.end);
  if (end > start) {
    return nowMinutes >= start && nowMinutes < end;
  }
  return nowMinutes >= start || nowMinutes < end;
}

/**
 * Compares wall-clock `now` against a restaurant's opening hours for the day the snapshot
 * was fetched. Assumes `now` is already in the restaurant's local time zone (no per-restaurant
 * time zone handling yet — see decision log).
 */
export function computeExpectedState(hoursToday: OpeningHoursInterval[], now: Date): ExpectedAvailability {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isOpen = hoursToday.some((interval) => isWithinInterval(interval, nowMinutes));
  return isOpen ? "expected-open" : "expected-closed";
}

export interface LiveFetchResult {
  status: number;
  html: string;
}

/**
 * Best-effort real fetch against the platform's public listing page (no auth).
 * Kept short-timeout and side-effect free — parsing failures are handled by the caller,
 * which falls back to a recorded fixture per the brief.
 */
export async function fetchLiveListing(url: string, timeoutMs = 5000): Promise<LiveFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "Mozilla/5.0 (availability-monitor pipeline)" },
    });
    return { status: res.status, html: await res.text() };
  } finally {
    clearTimeout(timeout);
  }
}

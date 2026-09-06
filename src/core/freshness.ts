/** Rolling default-view window: items older than this are hidden. */
export const FRESHNESS_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Allow a small clock-skew so slightly-future publisher timestamps still show. */
export const FUTURE_SKEW_MS = 15 * 60 * 1000;

export function parseTimestamp(raw: string | undefined | null): Date | null {
  if (!raw) {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const rfc2822 = Date.parse(trimmed);
  if (!Number.isNaN(rfc2822)) {
    return new Date(rfc2822);
  }

  // CISA listing pages often use "Sep 04, 2026"
  const named = Date.parse(trimmed.replace(/\s+/g, " "));
  if (!Number.isNaN(named)) {
    return new Date(named);
  }

  return null;
}

export function isFresh(
  publishedAt: Date,
  now: Date = new Date(),
  windowMs: number = FRESHNESS_WINDOW_MS,
): boolean {
  const age = now.getTime() - publishedAt.getTime();
  if (age < -FUTURE_SKEW_MS) {
    return false;
  }
  return age <= windowMs;
}

export function filterFreshHeadlines<T extends { publishedAt: string }>(
  items: readonly T[],
  now: Date = new Date(),
  windowMs: number = FRESHNESS_WINDOW_MS,
): { fresh: T[]; stale: number; undated: number } {
  let stale = 0;
  let undated = 0;
  const fresh: T[] = [];

  for (const item of items) {
    const published = parseTimestamp(item.publishedAt);
    if (!published) {
      undated += 1;
      continue;
    }
    if (isFresh(published, now, windowMs)) {
      fresh.push(item);
    } else {
      stale += 1;
    }
  }

  return { fresh, stale, undated };
}

export function hoursAgo(iso: string, now: Date = new Date()): number {
  const published = parseTimestamp(iso);
  if (!published) {
    return Number.POSITIVE_INFINITY;
  }
  return (now.getTime() - published.getTime()) / (60 * 60 * 1000);
}

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const hours = hoursAgo(iso, now);
  if (!Number.isFinite(hours)) {
    return "unknown";
  }
  if (hours < 0) {
    return "just now";
  }
  if (hours < 1) {
    const minutes = Math.max(1, Math.round(hours * 60));
    return `${minutes}m ago`;
  }
  if (hours < 24) {
    const whole = Math.floor(hours);
    return `${whole}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

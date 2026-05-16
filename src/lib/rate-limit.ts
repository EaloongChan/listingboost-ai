/**
 * IP-based rate limiter using in-memory storage.
 * Limits: 5 requests per hour, 15 requests per day per IP.
 */

interface RateLimitEntry {
  hourly: number[];
  daily: number[];
}

const MAX_HOURLY = 5;
const MAX_DAILY = 15;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const store = new Map<string, RateLimitEntry>();

/**
 * Check if the IP is within rate limits.
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export function checkRateLimit(ip: string): {
  allowed: boolean;
  reason?: string;
  retryAfterMs?: number;
} {
  const now = Date.now();
  let entry = store.get(ip);

  if (!entry) {
    entry = { hourly: [now], daily: [now] };
    store.set(ip, entry);
    return { allowed: true };
  }

  // Prune expired timestamps
  entry.hourly = entry.hourly.filter((t) => now - t < HOUR_MS);
  entry.daily = entry.daily.filter((t) => now - t < DAY_MS);

  // Check daily limit first (more restrictive)
  if (entry.daily.length >= MAX_DAILY) {
    const oldest = entry.daily[0];
    const retryAfterMs = DAY_MS - (now - oldest);
    return {
      allowed: false,
      reason: "Daily free limit reached. Please try again tomorrow.",
      retryAfterMs,
    };
  }

  // Check hourly limit
  if (entry.hourly.length >= MAX_HOURLY) {
    const oldest = entry.hourly[0];
    const retryAfterMs = HOUR_MS - (now - oldest);
    return {
      allowed: false,
      reason: `Hourly limit reached (${MAX_HOURLY}/hr). Please wait ${Math.ceil(retryAfterMs / 60000)} minute(s) or try again later.`,
      retryAfterMs,
    };
  }

  // Record this request
  entry.hourly.push(now);
  entry.daily.push(now);
  return { allowed: true };
}

/**
 * Get remaining quota for an IP (useful for frontend display).
 */
export function getRemainingQuota(ip: string): {
  hourlyRemaining: number;
  dailyRemaining: number;
} {
  const now = Date.now();
  const entry = store.get(ip);
  if (!entry) return { hourlyRemaining: MAX_HOURLY, dailyRemaining: MAX_DAILY };

  const hourlyUsed = entry.hourly.filter((t) => now - t < HOUR_MS).length;
  const dailyUsed = entry.daily.filter((t) => now - t < DAY_MS).length;

  return {
    hourlyRemaining: Math.max(0, MAX_HOURLY - hourlyUsed),
    dailyRemaining: Math.max(0, MAX_DAILY - dailyUsed),
  };
}

// Prune stale entries periodically (every 10 minutes)
if (typeof globalThis !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store) {
      entry.hourly = entry.hourly.filter((t) => now - t < HOUR_MS);
      entry.daily = entry.daily.filter((t) => now - t < DAY_MS);
      if (entry.hourly.length === 0 && entry.daily.length === 0) {
        store.delete(ip);
      }
    }
  }, 10 * 60 * 1000).unref?.();
}

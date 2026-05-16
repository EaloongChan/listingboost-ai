/**
 * Simple in-memory cache for AI generation results.
 * Keys are hashes of the request parameters.
 * Entries auto-expire after the specified TTL.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  // Prune old entries if cache grows too large (keep under 500)
  if (cache.size > 500) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
  }
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Generate a deterministic hash from request parameters.
 */
export function hashRequest(params: Record<string, unknown>): string {
  const str = JSON.stringify(params, Object.keys(params).sort());
  // Simple djb2 hash — good enough for cache keys
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return `req_${Math.abs(hash).toString(36)}`;
}

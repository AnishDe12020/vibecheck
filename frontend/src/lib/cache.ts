// Simple in-memory cache with TTL
// On Vercel serverless, this persists within a warm function instance (~5-15 min)

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number = DEFAULT_TTL): void {
  // Limit cache size to ~200 entries to stay within memory
  if (store.size > 200) {
    // Evict oldest entries
    const keys = Array.from(store.keys());
    for (let i = 0; i < 50; i++) {
      store.delete(keys[i]);
    }
  }
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

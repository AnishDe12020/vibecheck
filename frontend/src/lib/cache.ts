import { Redis } from '@upstash/redis';

// Upstash Redis cache with in-memory fallback
let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// In-memory fallback for local dev
const memStore = new Map<string, { data: unknown; expiresAt: number }>();

const DEFAULT_TTL_S = 3600; // 1 hour

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (redis) {
    try {
      const val = await redis.get<T>(key);
      return val;
    } catch (e) {
      console.warn('Redis cacheGet failed:', e);
    }
  }
  // Fallback
  const entry = memStore.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    if (entry) memStore.delete(key);
    return null;
  }
  return entry.data as T;
}

export async function cacheSet<T>(key: string, data: T, ttlS: number = DEFAULT_TTL_S): Promise<void> {
  if (redis) {
    try {
      await redis.set(key, data, { ex: ttlS });
      return;
    } catch (e) {
      console.warn('Redis cacheSet failed:', e);
    }
  }
  // Fallback
  if (memStore.size > 200) {
    const keys = Array.from(memStore.keys());
    for (let i = 0; i < 50; i++) memStore.delete(keys[i]);
  }
  memStore.set(key, { data, expiresAt: Date.now() + ttlS * 1000 });
}

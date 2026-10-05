/**
 * In-memory cache and in-flight request deduplicator.
 *
 * Design:
 * 1. In-flight Deduplication: If a request for cacheKey is currently pending,
 *    subsequent callers receive the identical pending Promise.
 * 2. TTL (Time-To-Live): Stored responses are kept in memory until expiry.
 * 3. Max Size Eviction: Prevents unbounded memory growth by evicting oldest entries.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MediaCache {
  private readonly ttlMs: number;
  private readonly maxEntries: number;
  private readonly entries = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(options?: { ttlMs?: number; maxEntries?: number }) {
    this.ttlMs = options?.ttlMs ?? 5 * 60 * 1000; // 5 minutes default
    this.maxEntries = options?.maxEntries ?? 100;
  }

  public get<T>(key: string): T | null {
    const entry = this.entries.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public set<T>(key: string, value: T, customTtlMs?: number): void {
    if (this.entries.size >= this.maxEntries) {
      // Evict oldest entry (first key in map iteration)
      const oldestKey = this.entries.keys().next().value;
      if (oldestKey) {
        this.entries.delete(oldestKey);
      }
    }

    const expiresAt = Date.now() + (customTtlMs ?? this.ttlMs);
    this.entries.set(key, { value, expiresAt });
  }

  /**
   * Retrieves from cache if available; otherwise deduplicates in-flight execution.
   */
  public async getOrFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Check if identical request is currently in-flight
    const pending = this.inFlight.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    const promise = (async () => {
      try {
        const result = await fetcher();
        this.set(key, result);
        return result;
      } finally {
        this.inFlight.delete(key);
      }
    })();

    this.inFlight.set(key, promise);
    return promise;
  }

  public delete(key: string): boolean {
    return this.entries.delete(key);
  }

  public clear(): void {
    this.entries.clear();
    this.inFlight.clear();
  }

  public get size(): number {
    return this.entries.size;
  }
}


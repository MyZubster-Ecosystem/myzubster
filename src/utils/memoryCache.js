/**
 * Small, dependency-free TTL + LRU cache for hot read paths (issue #99),
 * e.g. dashboard aggregates and bounty listings.
 *
 * Usage:
 *   const { cache } = require('./src/utils/memoryCache');
 *   const bounties = await cache.wrap('bounties:open:20',
 *     () => Bounty.find({ status: 'open' }).sort({ createdAt: -1 }).limit(20).lean(),
 *     30000); // served from memory for 30s, then re-queried
 */
'use strict';

class MemoryCache {
  constructor({ maxEntries = 500, defaultTtlMs = 30000 } = {}) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
    // Map preserves insertion order -> used for LRU eviction.
    this.store = new Map();
  }

  get(key) {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh recency.
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
    }
    return value;
  }

  /**
   * Read-through helper: return cached value or compute, store and return it.
   * @param {string} key
   * @param {Function} producer async function producing the fresh value
   * @param {number} [ttlMs]
   */
  async wrap(key, producer, ttlMs) {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const fresh = await producer();
    if (fresh !== undefined && fresh !== null) this.set(key, fresh, ttlMs);
    return fresh;
  }

  del(key) {
    return this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }

  get size() {
    return this.store.size;
  }
}

module.exports = { MemoryCache, cache: new MemoryCache() };

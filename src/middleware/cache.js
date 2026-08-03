// In-Memory Caching Middleware
// Provides LRU cache for frequently accessed data

class LRUCache {
  constructor(maxSize = 100, ttl = 60000) {
    this.maxSize = maxSize;
    this.ttl = ttl; // Time to live in milliseconds
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    this.stats.hits++;
    return item.value;
  }

  set(key, value) {
    // Delete if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { value, timestamp: Date.now() });
    this.stats.sets++;
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  clear() {
    this.cache.clear();
  }

  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : 'N/A',
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Create default cache instances
const plantCache = new LRUCache(50, 5 * 60 * 1000);   // 50 items, 5 min TTL
const animalCache = new LRUCache(50, 5 * 60 * 1000);  // 50 items, 5 min TTL
const bountyCache = new LRUCache(100, 2 * 60 * 1000); // 100 items, 2 min TTL

// Cache middleware factory
function createCacheMiddleware(cache, keyGenerator) {
  return (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : `${req.method}:${req.originalUrl}`;
    
    const cached = cache.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('X-Cache-Key', key);
      return res.json(cached);
    }
    
    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data);
      }
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };
    
    next();
  };
}

// Specific cache middlewares
const cachePlant = createCacheMiddleware(plantCache, (req) => {
  return `plant:${req.params.id || 'list'}:${JSON.stringify(req.query)}`;
});

const cacheAnimal = createCacheMiddleware(animalCache, (req) => {
  return `animal:${req.params.id || 'list'}:${JSON.stringify(req.query)}`;
});

const cacheBounty = createCacheMiddleware(bountyCache, (req) => {
  return `bounty:${req.params.id || 'list'}:${JSON.stringify(req.query)}`;
});

// Cache stats endpoint
function cacheStats(req, res) {
  res.json({
    plants: plantCache.getStats(),
    animals: animalCache.getStats(),
    bounties: bountyCache.getStats(),
  });
}

// Cache clear endpoint (admin only)
function cacheClear(req, res) {
  plantCache.clear();
  animalCache.clear();
  bountyCache.clear();
  res.json({ message: 'All caches cleared' });
}

module.exports = {
  LRUCache,
  plantCache,
  animalCache,
  bountyCache,
  cachePlant,
  cacheAnimal,
  cacheBounty,
  cacheStats,
  cacheClear,
};

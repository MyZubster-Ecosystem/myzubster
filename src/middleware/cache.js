// In-Memory LRU Cache Middleware

class LRUCache {
  constructor(maxSize = 100, ttl = 60000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.stats = { hits: 0, misses: 0 };
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.cache.delete(key);
    this.cache.set(key, item);
    this.stats.hits++;
    return item.value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, { value, timestamp: Date.now() });
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
    };
  }
}

const plantCache = new LRUCache(50, 5 * 60 * 1000);
const animalCache = new LRUCache(50, 5 * 60 * 1000);
const bountyCache = new LRUCache(100, 2 * 60 * 1000);

function createCacheMiddleware(cache, keyGenerator) {
  return (req, res, next) => {
    const key = keyGenerator ? keyGenerator(req) : `${req.method}:${req.originalUrl}`;
    
    const cached = cache.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }
    
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data);
      }
      res.set('X-Cache', 'MISS');
      return originalJson(data);
    };
    
    next();
  };
}

const cachePlant = createCacheMiddleware(plantCache, (req) => {
  return `plant:${req.params.id || 'list'}:${JSON.stringify(req.query)}`;
});

const cacheAnimal = createCacheMiddleware(animalCache, (req) => {
  return `animal:${req.params.id || 'list'}:${JSON.stringify(req.query)}`;
});

const cacheBounty = createCacheMiddleware(bountyCache, (req) => {
  return `bounty:${req.params.id || 'list'}:${JSON.stringify(req.query)}`;
});

function cacheStats(req, res) {
  res.json({
    plants: plantCache.getStats(),
    animals: animalCache.getStats(),
    bounties: bountyCache.getStats(),
  });
}

function cacheClear(req, res) {
  plantCache.clear();
  animalCache.clear();
  bountyCache.clear();
  res.json({ message: 'All caches cleared' });
}

module.exports = {
  LRUCache,
  cachePlant,
  cacheAnimal,
  cacheBounty,
  cacheStats,
  cacheClear,
};

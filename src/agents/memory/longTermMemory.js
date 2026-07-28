/**
 * Long-Term Memory System for AI Agents
 * 
 * Uses PostgreSQL for persistent storage
 * Supports: plants, pets, transactions, verifications
 */

class LongTermMemory {
  constructor(options = {}) {
    this.db = options.db || null;
    this.namespace = options.namespace || 'myzubster';
    this.collections = {
      plants: 'plant_history',
      pets: 'pet_history',
      transactions: 'tx_history',
      verifications: 'verification_history',
      userPreferences: 'user_preferences'
    };
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 300000;
  }

  async store(type, data) {
    const collection = this.collections[type] || 'default';
    if (this.db) {
      try {
        const result = await this.db.collection(collection).insertOne({
          ...data,
          type,
          storedAt: new Date()
        });
        this.cache.set(`${type}:${data.id || data.timestamp}`, {
          data,
          storedAt: new Date()
        });
        return result;
      } catch (error) {
        console.error('Memory store failed:', error);
        throw error;
      }
    }
    const key = `${type}:${data.id || data.timestamp}`;
    this.cache.set(key, {
      data,
      storedAt: new Date()
    });
    return { inserted: true, key };
  }

  async retrieve(type, id, options = {}) {
    const collection = this.collections[type] || 'default';
    const cacheKey = `${type}:${id}`;
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.storedAt.getTime() < this.cacheTTL) {
        return cached.data;
      }
      this.cache.delete(cacheKey);
    }
    if (this.db) {
      try {
        const result = await this.db.collection(collection).findOne({
          $or: [
            { id: id },
            { plantId: id },
            { petId: id },
            { txId: id },
            { itemId: id }
          ],
          ...options.query || {}
        });
        if (result) {
          this.cache.set(cacheKey, {
            data: result,
            storedAt: new Date()
          });
          return result;
        }
        return null;
      } catch (error) {
        console.error('Memory retrieve failed:', error);
        throw error;
      }
    }
    return this.cache.get(cacheKey)?.data || null;
  }

  async query(type, filter = {}, options = {}) {
    const collection = this.collections[type] || 'default';
    if (this.db) {
      try {
        const results = await this.db.collection(collection)
          .find(filter)
          .sort(options.sort || { storedAt: -1 })
          .limit(options.limit || 100)
          .toArray();
        return results;
      } catch (error) {
        console.error('Memory query failed:', error);
        throw error;
      }
    }
    const results = [];
    for (const [key, value] of this.cache) {
      if (key.startsWith(`${type}:`)) {
        results.push(value.data);
      }
    }
    return results;
  }

  async delete(type, id) {
    const collection = this.collections[type] || 'default';
    const cacheKey = `${type}:${id}`;
    this.cache.delete(cacheKey);
    if (this.db) {
      try {
        const result = await this.db.collection(collection).deleteOne({
          $or: [
            { id: id },
            { plantId: id },
            { petId: id },
            { txId: id },
            { itemId: id }
          ]
        });
        return result;
      } catch (error) {
        console.error('Memory delete failed:', error);
        throw error;
      }
    }
    return { deleted: true };
  }

  async clearCache() {
    this.cache.clear();
    return { cleared: true };
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      collections: Object.keys(this.collections),
      namespace: this.namespace
    };
  }
}

module.exports = LongTermMemory;

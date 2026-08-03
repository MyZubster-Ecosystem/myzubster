// Database Optimization Utilities
// Provides query optimization, index creation, and connection pooling

const sqlite3 = require('sqlite3').verbose();

// ── Database Connection Pool ──
class ConnectionPool {
  constructor(dbPath, poolSize = 5) {
    this.dbPath = dbPath;
    this.poolSize = poolSize;
    this.pool = [];
    this.active = 0;
    this.waiting = [];
  }

  async getConnection() {
    // Return existing connection if available
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    
    // Create new connection if under limit
    if (this.active < this.poolSize) {
      this.active++;
      return this._createConnection();
    }
    
    // Wait for available connection
    return new Promise((resolve) => {
      this.waiting.push(resolve);
    });
  }

  releaseConnection(conn) {
    // Return connection to pool
    if (this.waiting.length > 0) {
      const next = this.waiting.shift();
      next(conn);
    } else {
      this.pool.push(conn);
    }
  }

  _createConnection() {
    return new Promise((resolve, reject) => {
      const conn = new sqlite3.Database(this.dbPath, (err) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });
  }

  async close() {
    for (const conn of this.pool) {
      await new Promise((resolve) => conn.close(resolve));
    }
    this.pool = [];
  }
}

// ── Query Optimizer ──
class QueryOptimizer {
  constructor(db) {
    this.db = db;
    this.queryCache = new Map();
    this.slowQueries = [];
  }

  // Analyze and optimize a query
  async analyzeQuery(sql, params = []) {
    const startTime = process.hrtime.bigint();
    
    return new Promise((resolve, reject) => {
      // Use EXPLAIN QUERY PLAN to analyze
      this.db.all(`EXPLAIN QUERY PLAN ${sql}`, params, (err, plan) => {
        if (err) {
          reject(err);
          return;
        }
        
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1e6;
        
        const analysis = {
          sql,
          params,
          plan: plan.map(p => p.detail),
          duration: duration.toFixed(2) + 'ms',
          recommendations: this._generateRecommendations(plan, sql),
        };
        
        // Track slow queries
        if (duration > 100) { // > 100ms
          this.slowQueries.push({
            sql,
            duration,
            timestamp: Date.now(),
          });
          
          // Keep only last 100 slow queries
          if (this.slowQueries.length > 100) {
            this.slowQueries.shift();
          }
        }
        
        resolve(analysis);
      });
    });
  }

  // Generate optimization recommendations
  _generateRecommendations(plan, sql) {
    const recommendations = [];
    const planStr = plan.map(p => p.detail).join(' ');
    
    // Check for full table scans
    if (planStr.includes('SCAN TABLE')) {
      recommendations.push({
        type: 'INDEX',
        message: 'Full table scan detected. Consider adding an index.',
        severity: 'high',
      });
    }
    
    // Check for temporary B-tree
    if (planStr.includes('TEMP B-TREE')) {
      recommendations.push({
        type: 'QUERY',
        message: 'Temporary B-tree used. Consider simplifying ORDER BY or GROUP BY.',
        severity: 'medium',
      });
    }
    
    // Check for nested loops
    if (planStr.includes('NESTED LOOP')) {
      recommendations.push({
        type: 'INDEX',
        message: 'Nested loop join detected. Ensure join columns are indexed.',
        severity: 'medium',
      });
    }
    
    // Check for SELECT *
    if (sql.includes('SELECT *')) {
      recommendations.push({
        type: 'QUERY',
        message: 'SELECT * detected. Specify only needed columns for better performance.',
        severity: 'low',
      });
    }
    
    return recommendations;
  }

  // Get slow queries report
  getSlowQueries(limit = 10) {
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }
}

// ── Index Manager ──
class IndexManager {
  constructor(db) {
    this.db = db;
  }

  // Create index if not exists
  async createIndex(table, columns, options = {}) {
    const { unique = false, where = null } = options;
    const indexName = `idx_${table}_${columns.join('_')}`;
    
    let sql = `CREATE ${unique ? 'UNIQUE' : ''} INDEX IF NOT EXISTS ${indexName} ON ${table}(${columns.join(', ')})`;
    if (where) {
      sql += ` WHERE ${where}`;
    }
    
    return new Promise((resolve, reject) => {
      this.db.run(sql, (err) => {
        if (err) reject(err);
        else resolve({ created: true, name: indexName, sql });
      });
    });
  }

  // Drop index
  async dropIndex(indexName) {
    return new Promise((resolve, reject) => {
      this.db.run(`DROP INDEX IF EXISTS ${indexName}`, (err) => {
        if (err) reject(err);
        else resolve({ dropped: true, name: indexName });
      });
    });
  }

  // List all indexes
  async listIndexes() {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL",
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Analyze table
  async analyzeTable(tableName) {
    return new Promise((resolve, reject) => {
      this.db.run(`ANALYZE ${tableName}`, (err) => {
        if (err) reject(err);
        else resolve({ analyzed: true, table: tableName });
      });
    });
  }

  // Get index statistics
  async getIndexStats() {
    const indexes = await this.listIndexes();
    return {
      totalIndexes: indexes.length,
      indexes: indexes.map(idx => ({
        name: idx.name,
        table: idx.tbl_name,
        definition: idx.sql,
      })),
    };
  }
}

// ── Database Optimizer (Main Class) ──
class DatabaseOptimizer {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.pool = new ConnectionPool(dbPath);
    this.optimizer = null;
    this.indexManager = null;
  }

  async initialize() {
    this.db = await this.pool.getConnection();
    this.optimizer = new QueryOptimizer(this.db);
    this.indexManager = new IndexManager(this.db);
  }

  // Optimize MyZubster database
  async optimizeMyZubster() {
    const results = {
      indexes: [],
      queries: [],
      stats: {},
    };

    // Create recommended indexes
    const indexesToCreate = [
      // Plants table
      { table: 'plants', columns: ['name'] },
      { table: 'plants', columns: ['category'] },
      { table: 'plants', columns: ['name', 'category'] },
      
      // Animals table
      { table: 'animals', columns: ['name'] },
      { table: 'animals', columns: ['type'] },
      
      // Bounties table
      { table: 'bounties', columns: ['status'] },
      { table: 'bounties', columns: ['created_at'] },
      { table: 'bounties', columns: ['status', 'created_at'] },
      
      // Users table
      { table: 'users', columns: ['username'] },
      { table: 'users', columns: ['email'] },
    ];

    for (const idx of indexesToCreate) {
      try {
        const result = await this.indexManager.createIndex(idx.table, idx.columns);
        results.indexes.push(result);
      } catch (err) {
        results.indexes.push({ error: err.message, ...idx });
      }
    }

    // Analyze common queries
    const queriesToAnalyze = [
      'SELECT * FROM plants WHERE name LIKE ?',
      'SELECT * FROM plants WHERE category = ?',
      'SELECT * FROM animals WHERE type = ?',
      'SELECT * FROM bounties WHERE status = ? ORDER BY created_at DESC',
      'SELECT COUNT(*) FROM bounties WHERE status = ?',
    ];

    for (const sql of queriesToAnalyze) {
      try {
        const analysis = await this.optimizer.analyzeQuery(sql, ['%test%']);
        results.queries.push(analysis);
      } catch (err) {
        results.queries.push({ error: err.message, sql });
      }
    }

    // Get index statistics
    results.stats = await this.indexManager.getIndexStats();

    return results;
  }

  // Get performance report
  getPerformanceReport() {
    return {
      slowQueries: this.optimizer.getSlowQueries(),
      indexStats: null, // Will be populated async
    };
  }

  async close() {
    await this.pool.close();
  }
}

module.exports = {
  LRUCache: require('./cache').LRUCache,
  ConnectionPool,
  QueryOptimizer,
  IndexManager,
  DatabaseOptimizer,
};

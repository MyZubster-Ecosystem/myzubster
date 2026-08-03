// Prometheus Metrics Exporter
// Exports application metrics in Prometheus format

const client = require('prom-client');

// ── Collect Default Metrics ──
client.collectDefaultMetrics({ prefix: 'myzubster_' });

// ── Custom Metrics ──
const httpRequestDuration = new client.Histogram({
  name: 'myzubster_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new client.Counter({
  name: 'myzubster_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpRequestErrors = new client.Counter({
  name: 'myzubster_http_request_errors_total',
  help: 'Total number of HTTP request errors',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new client.Gauge({
  name: 'myzubster_active_connections',
  help: 'Number of active connections',
});

const cacheHits = new client.Counter({
  name: 'myzubster_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_name'],
});

const cacheMisses = new client.Counter({
  name: 'myzubster_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_name'],
});

const dbQueryDuration = new client.Histogram({
  name: 'myzubster_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
});

const dbQueryTotal = new client.Counter({
  name: 'myzubster_db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'table'],
});

// ── Middleware ──
function prometheusMiddleware(req, res, next) {
  const startTime = Date.now();
  
  // Track active connections
  activeConnections.inc();
  
  // Capture response finish
  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    const route = req.route?.path || req.path;
    
    // Record request metrics
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    
    // Track errors
    if (res.statusCode >= 400) {
      httpRequestErrors
        .labels(req.method, route, res.statusCode.toString())
        .inc();
    }
    
    // Decrement active connections
    activeConnections.dec();
  });
  
  next();
}

// ── Metrics Endpoint ──
async function metricsEndpoint(req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}

// ── Metrics JSON Endpoint ──
async function metricsJsonEndpoint(req, res) {
  const metrics = await client.register.getMetrics();
  res.json(metrics.map(m => ({
    name: m.name,
    help: m.help,
    type: m.type,
    values: m.values,
  })));
}

// ── Helper Functions ──
function recordCacheHit(cacheName) {
  cacheHits.labels(cacheName).inc();
}

function recordCacheMiss(cacheName) {
  cacheMisses.labels(cacheName).inc();
}

function recordDbQuery(operation, table, duration) {
  dbQueryDuration.labels(operation, table).observe(duration);
  dbQueryTotal.labels(operation, table).inc();
}

// ── Reset Metrics (for testing) ──
function resetMetrics() {
  client.register.clear();
  client.collectDefaultMetrics({ prefix: 'myzubster_' });
}

module.exports = {
  prometheusMiddleware,
  metricsEndpoint,
  metricsJsonEndpoint,
  recordCacheHit,
  recordCacheMiss,
  recordDbQuery,
  resetMetrics,
  client,
};

# Load Testing and Performance Optimization

This directory contains load testing scripts and performance optimization tools for MyZubster.

## 📊 Load Testing

### k6 Load Tests

**Installation:**
```bash
# macOS
brew install k6

# Windows
choco install k6

# Linux
sudo snap install k6
```

**Running Tests:**

```bash
# Default load test
k6 run loadtest/k6/load-test.js

# Stress test
k6 run --env SCENARIO=stress loadtest/k6/load-test.js

# Spike test
k6 run --env SCENARIO=spike loadtest/k6/load-test.js

# Soak test (prolonged)
k6 run --env SCENARIO=soak loadtest/k6/load-test.js

# Custom target URL
k6 run --env BASE_URL=http://your-server:3000 loadtest/k6/load-test.js
```

**Test Scenarios:**
- `smoke`: Minimal load (2 users, 30s)
- `load`: Normal traffic (10 users, 2.5 min)
- `stress`: Beyond capacity (50-100 users)
- `spike`: Sudden traffic burst (5→100→5 users)
- `soak`: Prolonged load (20 users, 5 min)

### Artillery Load Tests

**Installation:**
```bash
npm install -g artillery
```

**Running Tests:**
```bash
# Run load test
artillery run loadtest/artillery/load-test.yml

# Generate JSON report
artillery run loadtest/artillery/load-test.yml --reporters json
```

## 🚀 Performance Optimization

### Caching Layer

The application includes an in-memory LRU cache for frequently accessed data:

```javascript
const { cachePlant, cacheAnimal, cacheBounty } = require('./middleware/cache');

// Apply to routes
app.get('/api/plants', cachePlant, plantsController.list);
app.get('/api/animals', cacheAnimal, animalsController.list);
```

**Cache Configuration:**
- Plants: 50 items, 5 min TTL
- Animals: 50 items, 5 min TTL
- Bounties: 100 items, 2 min TTL

### Database Optimization

```javascript
const { DatabaseOptimizer } = require('./utils/db-optimizer');

// Initialize optimizer
const optimizer = new DatabaseOptimizer('./data/myzubster.db');
await optimizer.initialize();

// Run optimization
const results = await optimizer.optimizeMyZubster();
console.log(results);
```

**Optimizations Applied:**
- Indexes on frequently queried columns
- Query analysis and recommendations
- Connection pooling
- Slow query tracking

### Performance Monitoring

```javascript
const { performanceMiddleware } = require('./middleware/performance');

// Apply middleware
app.use(performanceMiddleware);

// Get performance summary
const { getPerformanceSummary } = require('./middleware/performance');
const summary = getPerformanceSummary();
console.log(summary);
```

## 📈 Monitoring Stack

### Prometheus

Access at: `http://localhost:9090`

**Metrics Available:**
- `myzubster_http_requests_total` - Total HTTP requests
- `myzubster_http_request_duration_seconds` - Request duration
- `myzubster_http_request_errors_total` - Request errors
- `myzubster_active_connections` - Active connections
- `myzubster_cache_hits_total` - Cache hits
- `myzubster_cache_misses_total` - Cache misses

### Grafana

Access at: `http://localhost:3001`
- Username: `admin`
- Password: `admin`

**Dashboard Panels:**
- Request Rate (req/s)
- Response Time (p95)
- Error Rate
- Active Connections
- Cache Hit Rate

## 🐳 Auto-Scaling

### Docker Compose Scaling

```bash
# Start with 3 application instances
docker-compose -f docker-compose.scaling.yml up --scale myzubster=3

# Scale up
docker-compose -f docker-compose.scaling.yml up --scale myzubster=5

# Scale down
docker-compose -f docker-compose.scaling.yml up --scale myzubster=1
```

### Load Balancer (Nginx)

Nginx automatically distributes traffic across instances using least connections algorithm.

**Configuration:** `nginx/nginx.conf`

## 📊 Performance Targets

| Metric | Target | Description |
|--------|--------|-------------|
| p95 Response Time | < 500ms | 95% of requests complete within 500ms |
| p99 Response Time | < 1000ms | 99% of requests complete within 1s |
| Error Rate | < 10% | Less than 10% of requests fail |
| Cache Hit Rate | > 80% | More than 80% cache hits |
| Requests/Second | > 100 | Handle at least 100 requests per second |

## 🔧 Troubleshooting

### High Response Times

1. Check database indexes: `npm run db:analyze`
2. Review slow queries in performance summary
3. Increase cache TTL if data doesn't change frequently
4. Scale application instances

### High Error Rate

1. Check application logs
2. Verify database connections
3. Check memory usage
4. Review rate limiting configuration

### Cache Misses

1. Verify cache middleware is applied
2. Check cache TTL settings
3. Monitor cache hit rate in Grafana

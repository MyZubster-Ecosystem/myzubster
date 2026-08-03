# MyZubster Load Testing

## k6 Load Tests

### Installation
```bash
# macOS
brew install k6

# Windows
choco install k6
```

### Running Tests
```bash
# Load test
k6 run loadtest/k6/load-test.js

# Custom target
k6 run --env BASE_URL=http://your-server:3000 loadtest/k6/load-test.js
```

## Performance Optimization

### Caching
Apply caching middleware to routes:
```javascript
const { cachePlant, cacheAnimal, cacheBounty } = require('./middleware/cache');

app.get('/api/plants', cachePlant, plantsController.list);
app.get('/api/animals', cacheAnimal, animalsController.list);
app.get('/api/bounties', cacheBounty, bountiesController.list);
```

### Performance Monitoring
```javascript
const { performanceMiddleware } = require('./middleware/performance');
app.use(performanceMiddleware);

// Get metrics
const { getPerformanceSummary } = require('./middleware/performance');
console.log(getPerformanceSummary());
```

## Performance Targets

| Metric | Target |
|--------|--------|
| p95 Response Time | < 500ms |
| p99 Response Time | < 1000ms |
| Error Rate | < 10% |

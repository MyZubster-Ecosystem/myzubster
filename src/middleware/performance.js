// Performance Monitoring Middleware
// Tracks response times, throughput, and errors

const metrics = {
  requests: { total: 0, success: 0, error: 0 },
  responseTimes: [],
  endpoints: {},
  startTime: Date.now(),
};

// Get performance summary
function getPerformanceSummary() {
  const uptime = (Date.now() - metrics.startTime) / 1000;
  const avgResponseTime = metrics.responseTimes.length > 0
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
    : 0;
  
  const sortedTimes = [...metrics.responseTimes].sort((a, b) => a - b);
  const p95Index = Math.floor(sortedTimes.length * 0.95);
  const p99Index = Math.floor(sortedTimes.length * 0.99);
  
  return {
    uptime: Math.round(uptime) + 's',
    totalRequests: metrics.requests.total,
    successRate: metrics.requests.total > 0
      ? ((metrics.requests.success / metrics.requests.total) * 100).toFixed(2) + '%'
      : 'N/A',
    errorRate: metrics.requests.total > 0
      ? ((metrics.requests.error / metrics.requests.total) * 100).toFixed(2) + '%'
      : 'N/A',
    avgResponseTime: avgResponseTime.toFixed(2) + 'ms',
    p95ResponseTime: sortedTimes[p95Index] ? sortedTimes[p95Index].toFixed(2) + 'ms' : 'N/A',
    p99ResponseTime: sortedTimes[p99Index] ? sortedTimes[p99Index].toFixed(2) + 'ms' : 'N/A',
    requestsPerSecond: (metrics.requests.total / uptime).toFixed(2),
    endpoints: metrics.endpoints,
  };
}

// Middleware function
function performanceMiddleware(req, res, next) {
  const startTime = process.hrtime.bigint();
  
  // Track request
  metrics.requests.total++;
  
  // Capture response finish
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // ns to ms
    
    // Track response time
    metrics.responseTimes.push(duration);
    
    // Keep only last 1000 response times
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes.shift();
    }
    
    // Track success/error
    if (res.statusCode >= 200 && res.statusCode < 400) {
      metrics.requests.success++;
    } else {
      metrics.requests.error++;
    }
    
    // Track per-endpoint
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    if (!metrics.endpoints[endpoint]) {
      metrics.endpoints[endpoint] = {
        count: 0,
        totalTime: 0,
        errors: 0,
        p95: 0,
        p99: 0,
        times: [],
      };
    }
    
    const ep = metrics.endpoints[endpoint];
    ep.count++;
    ep.totalTime += duration;
    ep.times.push(duration);
    
    if (res.statusCode >= 400) {
      ep.errors++;
    }
    
    // Keep only last 100 times per endpoint
    if (ep.times.length > 100) {
      ep.times.shift();
    }
    
    // Calculate p95/p99 for endpoint
    const sorted = [...ep.times].sort((a, b) => a - b);
    ep.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    ep.p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    ep.avg = (ep.totalTime / ep.count).toFixed(2);
  });
  
  next();
}

// Prometheus metrics endpoint
function prometheusMetrics(req, res) {
  const summary = getPerformanceSummary();
  
  let output = '# HELP myzubster_requests_total Total number of requests\n';
  output += '# TYPE myzubster_requests_total counter\n';
  output += `myzubster_requests_total ${summary.totalRequests}\n\n`;
  
  output += '# HELP myzubster_request_duration_seconds Response time in seconds\n';
  output += '# TYPE myzubster_request_duration_seconds summary\n';
  output += `myzubster_request_duration_seconds{quantile="0.95"} ${parseFloat(summary.p95ResponseTime) / 1000 || 0}\n`;
  output += `myzubster_request_duration_seconds{quantile="0.99"} ${parseFloat(summary.p99ResponseTime) / 1000 || 0}\n`;
  output += `myzubster_request_duration_seconds{quantile="0.5"} ${parseFloat(summary.avgResponseTime) / 1000 || 0}\n\n`;
  
  output += '# HELP myzubster_errors_total Total number of errors\n';
  output += '# TYPE myzubster_errors_total counter\n';
  output += `myzubster_errors_total ${metrics.requests.error}\n\n`;
  
  output += '# HELP myzubster_requests_per_second Current request rate\n';
  output += '# TYPE myzubster_requests_per_second gauge\n';
  output += `myzubster_requests_per_second ${summary.requestsPerSecond}\n`;
  
  res.set('Content-Type', 'text/plain');
  res.send(output);
}

// JSON metrics endpoint
function jsonMetrics(req, res) {
  res.json(getPerformanceSummary());
}

// Reset metrics (for testing)
function resetMetrics() {
  metrics.requests = { total: 0, success: 0, error: 0 };
  metrics.responseTimes = [];
  metrics.endpoints = {};
  metrics.startTime = Date.now();
}

module.exports = {
  performanceMiddleware,
  prometheusMetrics,
  jsonMetrics,
  resetMetrics,
  getPerformanceSummary,
};

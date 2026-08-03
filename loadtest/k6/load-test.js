// k6 Load Test for MyZubster
// Run: k6 run loadtest/k6/load-test.js
// Install: https://k6.io/docs/getting-started/installation/

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ── Custom Metrics ──
const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration', true);
const apiCalls = new Counter('api_calls');

// ── Test Configuration ──
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },     // Stay at 10 users
    { duration: '30s', target: 25 },    // Ramp up to 25 users
    { duration: '2m', target: 25 },     // Stay at 25 users
    { duration: '30s', target: 50 },    // Ramp up to 50 users (peak)
    { duration: '1m', target: 50 },     // Stay at 50 users
    { duration: '30s', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],  // 95th percentile < 500ms
    errors: ['rate<0.1'],                             // Error rate < 10%
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// ── Helper: Random ID ──
function randomId() {
  return Math.floor(Math.random() * 1000) + 1;
}

// ── Test: Health Check ──
function testHealthCheck() {
  group('Health Check', () => {
    const res = http.get(`${BASE_URL}/api/health`);
    check(res, {
      'health status 200': (r) => r.status === 200,
      'health response time < 100ms': (r) => r.timings.duration < 100,
    });
    errorRate.add(res.status !== 200);
    requestDuration.add(res.timings.duration);
    apiCalls.add(1);
  });
}

// ── Test: Auth Endpoints ──
function testAuth() {
  group('Auth - Register', () => {
    const payload = JSON.stringify({
      username: `loadtest_${Date.now()}_${randomId()}`,
      email: `loadtest_${Date.now()}_${randomId()}@test.com`,
      password: 'TestPassword123!',
    });
    const params = { headers: { 'Content-Type': 'application/json' } };
    const res = http.post(`${BASE_URL}/api/auth/register`, payload, params);
    check(res, {
      'register status 201 or 409': (r) => r.status === 201 || r.status === 409,
    });
    errorRate.add(res.status !== 201 && res.status !== 409);
    requestDuration.add(res.timings.duration);
    apiCalls.add(1);
  });
}

// ── Test: Plants Endpoints ──
function testPlants() {
  group('Plants - List All', () => {
    const res = http.get(`${BASE_URL}/api/plants`);
    check(res, {
      'plants list status 200': (r) => r.status === 200,
      'plants list response time < 300ms': (r) => r.timings.duration < 300,
    });
    errorRate.add(res.status !== 200);
    requestDuration.add(res.timings.duration);
    apiCalls.add(1);
  });

  group('Plants - Get by ID', () => {
    const res = http.get(`${BASE_URL}/api/plants/${randomId()}`);
    check(res, {
      'plant by id status 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    errorRate.add(res.status !== 200 && res.status !== 404);
    requestDuration.add(res.timings.duration);
    apiCalls.add(1);
  });

  group('Plants - Search', () => {
    const res = http.get(`${BASE_URL}/api/plants?search=rose`);
    check(res, {
      'plant search status 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    requestDuration.add(res.timings.duration);
    apiCalls.add(1);
  });
}

// ── Test: Animals Endpoints ──
function testAnimals() {
  group('Animals - List All', () => {
    const res = http.get(`${BASE_URL}/api/animals`);
    check(res, {
      'animals list status 200': (r) => r.status === 200,
      'animals list response time < 300ms': (r) => r.timings.duration < 300,
    });
    errorRate.add(res.status !== 200);
    requestDuration.add(res.timings.duration);
    apiCalls.add(1);
  });

  group('Animals - Get by ID', () => {
    const res = http.get(`${BASE_URL}/api/animals/${randomId()}`);
    check(res, {
      'animal by id status 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    errorRate.add(res.status !== 200 && res.status !== 404);
    requestDuration.add(res.timings.duration);
    apiCalls.add(1);
  });
}

// ── Test: Bounties Endpoints ──
function testBounties() {
  group('Bounties - List All', () => {
    const res = http.get(`${BASE_URL}/api/bounties`);
    check(res, {
      'bounties list status 200': (r) => r.status === 200,
      'bounties list response time < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(res.status !== 200);
    requestDuration.add(res.timings.duration);
    apiCalls.add(1);
  });

  group('Bounties - Get by ID', () => {
    const res = http.get(`${BASE_URL}/api/bounties/${randomId()}`);
    check(res, {
      'bounty by id status 200 or 404': (r) => r.status === 200 || r.status === 404,
    });
    errorRate.add(res.status !== 200 && res.status !== 404);
    requestDuration.add(res.timings.duration);
    apiCalls.add(1);
  });
}

// ── Test: Combined API Flow (Realistic User) ──
function testUserFlow() {
  group('User Flow: Browse & Search', () => {
    // 1. Health check
    let res = http.get(`${BASE_URL}/api/health`);
    
    // 2. List plants
    res = http.get(`${BASE_URL}/api/plants`);
    check(res, { 'flow plants 200': (r) => r.status === 200 });
    
    // 3. Search plants
    res = http.get(`${BASE_URL}/api/plants?search=tomato`);
    check(res, { 'flow search 200': (r) => r.status === 200 });
    
    // 4. Get random plant
    res = http.get(`${BASE_URL}/api/plants/${randomId()}`);
    
    // 5. List animals
    res = http.get(`${BASE_URL}/api/animals`);
    check(res, { 'flow animals 200': (r) => r.status === 200 });
    
    // 6. List bounties
    res = http.get(`${BASE_URL}/api/bounties`);
    check(res, { 'flow bounties 200': (r) => r.status === 200 });
    
    apiCalls.add(6);
  });
}

// ── Main Test Loop ──
export default function () {
  const scenario = Math.random();
  
  if (scenario < 0.2) {
    testHealthCheck();
  } else if (scenario < 0.35) {
    testAuth();
  } else if (scenario < 0.55) {
    testPlants();
  } else if (scenario < 0.7) {
    testAnimals();
  } else if (scenario < 0.85) {
    testBounties();
  } else {
    testUserFlow();
  }
  
  sleep(Math.random() * 2 + 1); // 1-3s between requests
}

// ── Summary Report ──
export function handleSummary(data) {
  return {
    'loadtest/k6/results/summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data) {
  const metrics = data.metrics;
  let summary = '\n\n========== LOAD TEST SUMMARY ==========\n';
  summary += `Total Requests: ${metrics.http_reqs.values.count}\n`;
  summary += `Request Duration (p95): ${metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `Request Duration (p99): ${metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += `Error Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%\n`;
  summary += `Throughput: ${metrics.http_reqs.values.rate.toFixed(2)} req/s\n`;
  summary += '========================================\n';
  return summary;
}

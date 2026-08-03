// k6 Load Test for MyZubster
// Run: k6 run loadtest/k6/load-test.js

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const requestDuration = new Trend('request_duration', true);
const apiCalls = new Counter('api_calls');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 25 },
    { duration: '2m', target: 25 },
    { duration: '30s', target: 50 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors: ['rate<0.1'],
    http_req_failed: ['rate<0.1'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

function randomId() {
  return Math.floor(Math.random() * 1000) + 1;
}

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
}

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
}

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
}

export default function () {
  const scenario = Math.random();
  
  if (scenario < 0.2) {
    testHealthCheck();
  } else if (scenario < 0.5) {
    testPlants();
  } else if (scenario < 0.75) {
    testAnimals();
  } else {
    testBounties();
  }
  
  sleep(Math.random() * 2 + 1);
}

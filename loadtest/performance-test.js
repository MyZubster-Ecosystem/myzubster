// Performance Test Script
// Run: node loadtest/performance-test.js

const http = require('http');
const { performance } = require('perf_hooks');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ── Test Results ──
const results = {
  totalRequests: 0,
  successRequests: 0,
  errorRequests: 0,
  responseTimes: [],
  errors: [],
};

// ── HTTP Request Helper ──
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const req = http.get(`${BASE_URL}${path}`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        results.totalRequests++;
        results.responseTimes.push(duration);
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
          results.successRequests++;
        } else {
          results.errorRequests++;
          results.errors.push({
            path,
            status: res.statusCode,
            duration,
          });
        }
        
        resolve({
          status: res.statusCode,
          duration,
          data: data.substring(0, 100), // First 100 chars
        });
      });
    });
    
    req.on('error', (err) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      results.totalRequests++;
      results.errorRequests++;
      results.errors.push({
        path,
        error: err.message,
        duration,
      });
      
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// ── Test Suite ──
async function runTests() {
  console.log('🚀 Starting Performance Test Suite\n');
  console.log(`Target: ${BASE_URL}`);
  console.log('='.repeat(60));
  
  // Test 1: Health Check
  console.log('\n1. Health Check');
  try {
    const result = await makeRequest('/api/health');
    console.log(`   Status: ${result.status} | Duration: ${result.duration.toFixed(2)}ms`);
  } catch (err) {
    console.log(`   Error: ${err.message}`);
  }
  
  // Test 2: List Plants
  console.log('\n2. List Plants');
  try {
    const result = await makeRequest('/api/plants');
    console.log(`   Status: ${result.status} | Duration: ${result.duration.toFixed(2)}ms`);
  } catch (err) {
    console.log(`   Error: ${err.message}`);
  }
  
  // Test 3: Search Plants
  console.log('\n3. Search Plants');
  try {
    const result = await makeRequest('/api/plants?search=tomato');
    console.log(`   Status: ${result.status} | Duration: ${result.duration.toFixed(2)}ms`);
  } catch (err) {
    console.log(`   Error: ${err.message}`);
  }
  
  // Test 4: List Animals
  console.log('\n4. List Animals');
  try {
    const result = await makeRequest('/api/animals');
    console.log(`   Status: ${result.status} | Duration: ${result.duration.toFixed(2)}ms`);
  } catch (err) {
    console.log(`   Error: ${err.message}`);
  }
  
  // Test 5: List Bounties
  console.log('\n5. List Bounties');
  try {
    const result = await makeRequest('/api/bounties');
    console.log(`   Status: ${result.status} | Duration: ${result.duration.toFixed(2)}ms`);
  } catch (err) {
    console.log(`   Error: ${err.message}`);
  }
  
  // Test 6: Concurrent Requests (10 parallel)
  console.log('\n6. Concurrent Requests (10 parallel)');
  const concurrentStart = performance.now();
  const concurrentPromises = Array(10).fill().map((_, i) => 
    makeRequest(`/api/plants?page=${i + 1}`)
  );
  
  try {
    const concurrentResults = await Promise.all(concurrentPromises);
    const concurrentEnd = performance.now();
    const concurrentDuration = concurrentEnd - concurrentStart;
    console.log(`   Completed in ${concurrentDuration.toFixed(2)}ms`);
    console.log(`   Average per request: ${(concurrentDuration / 10).toFixed(2)}ms`);
  } catch (err) {
    console.log(`   Error: ${err.message}`);
  }
  
  // Test 7: Rapid Requests (50 sequential)
  console.log('\n7. Rapid Requests (50 sequential)');
  const rapidStart = performance.now();
  
  for (let i = 0; i < 50; i++) {
    try {
      await makeRequest('/api/health');
    } catch (err) {
      // Ignore individual errors
    }
  }
  
  const rapidEnd = performance.now();
  const rapidDuration = rapidEnd - rapidStart;
  console.log(`   Completed in ${rapidDuration.toFixed(2)}ms`);
  console.log(`   Average per request: ${(rapidDuration / 50).toFixed(2)}ms`);
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('='.repeat(60));
  
  const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  const sortedTimes = [...results.responseTimes].sort((a, b) => a - b);
  const p95Index = Math.floor(sortedTimes.length * 0.95);
  const p99Index = Math.floor(sortedTimes.length * 0.99);
  
  console.log(`Total Requests: ${results.totalRequests}`);
  console.log(`Success: ${results.successRequests} (${((results.successRequests / results.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Errors: ${results.errorRequests} (${((results.errorRequests / results.totalRequests) * 100).toFixed(2)}%)`);
  console.log(`Average Response Time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`P95 Response Time: ${sortedTimes[p95Index].toFixed(2)}ms`);
  console.log(`P99 Response Time: ${sortedTimes[p99Index].toFixed(2)}ms`);
  console.log(`Requests/Second: ${(results.totalRequests / (rapidDuration / 1000)).toFixed(2)}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.slice(0, 5).forEach(err => {
      console.log(`   ${err.path}: ${err.status || err.error} (${err.duration.toFixed(2)}ms)`);
    });
  }
  
  console.log('\n✅ Performance test completed!');
}

// Run tests
runTests().catch(console.error);

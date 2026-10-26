'use strict';

/**
 * scripts/run-seller-walkthrough-live.js
 * End-to-End Live Runtime Verifier for MyZubster Seller-Free Walkthrough.
 *
 * Runs the real Express server against an isolated in-memory MongoMemoryReplSet,
 * executes the full 10-step user journey via live HTTP requests, and outputs
 * structured verification evidence with timings and HTTP responses.
 */

const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'walkthrough-live-secret-2026';
process.env.PORT = '3000';

const app = require('../server');

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('================================================================');
  console.log('🚀 MYZUBSTER SELLER-FREE LIVE RUNTIME WALKTHROUGH (E2E EVIDENCE)');
  console.log('================================================================\n');

  const overallStart = Date.now();

  console.log('[Setup] Spinning up isolated MongoMemoryReplSet...');
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = mongo.getUri();
  await mongoose.connect(mongoUri);
  console.log(`[Setup] Connected to in-memory database: ${mongoUri.replace(/:[0-9]+\//, ':*****\/')}`);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3000, resolve));
  console.log('[Setup] Live Express server listening on http://127.0.0.1:3000\n');

  const BASE_URL = 'http://127.0.0.1:3000';
  const steps = [];

  try {
    // Step 1: Unauthenticated user attempt to publish
    console.log('[Step 1/10] Verifying unauthenticated publish protection...');
    const t0 = Date.now();
    const unauthRes = await fetchJson(`${BASE_URL}/api/listings/create`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Unauthenticated Test' })
    });
    const d0 = Date.now() - t0;
    if (unauthRes.status === 401) {
      console.log(`  ✓ Blocked with HTTP 401 Unauthorized (${d0}ms)`);
      steps.push({ step: 1, name: 'Unauthenticated publish guard', status: 'PASS', httpStatus: 401, timeMs: d0 });
    } else {
      throw new Error(`Expected 401, got ${unauthRes.status}`);
    }

    // Step 2: Register & authenticate seller
    console.log('\n[Step 2/10] Registering & authenticating test seller (wasim-seller-dev)...');
    const t1 = Date.now();
    const regRes = await fetchJson(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'wasim-seller-dev',
        email: 'wasim-seller@example.test',
        password: 'secure-walkthrough-password-2026'
      })
    });
    const d1 = Date.now() - t1;
    const token = regRes.data?.data?.token || regRes.data?.token;
    if (token) {
      console.log(`  ✓ Registered & token generated (${d1}ms)`);
      steps.push({ step: 2, name: 'Seller registration & auth token', status: 'PASS', httpStatus: regRes.status, timeMs: d1 });
    } else {
      throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
    }

    // Step 3: Activate Seller Free plan
    console.log('\n[Step 3/10] Activating Seller Free plan...');
    const t2 = Date.now();
    const subscribeRes = await fetchJson(`${BASE_URL}/api/marketplace/seller/subscribe`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({})
    });
    const d2 = Date.now() - t2;
    const planId = subscribeRes.data?.plan?.id || subscribeRes.data?.membership?.plan || subscribeRes.data?.plan;
    if (subscribeRes.status === 201 && (planId === 'SELLER_FREE' || subscribeRes.data?.active)) {
      console.log(`  ✓ Seller Free activated with HTTP 201 Created (${d2}ms)`);
      console.log(`    Membership ID: ${subscribeRes.data.membership?._id || subscribeRes.data.membershipId}, Status: active=${subscribeRes.data.active}`);
      steps.push({ step: 3, name: 'Seller Free activation', status: 'PASS', httpStatus: 201, timeMs: d2 });
    } else {
      throw new Error(`Subscribe failed: ${JSON.stringify(subscribeRes.data)}`);
    }

    // Step 4: Publish text-only service listing in digital_services
    console.log('\n[Step 4/10] Publishing service listing in digital_services...');
    const t3 = Date.now();
    const listingPayload = {
      title: 'Consulenza Architettura Software, Docker & Hardening CI/CD',
      description: 'Revisione architetturale per progetti decentralizzati, configurazione Docker fail-closed, audit pipeline GitHub Actions e supporto remoto diretto.',
      category: 'digital_services',
      currency: 'FREE',
      price: 0,
      location: 'Remoto'
    };
    const createRes = await fetchJson(`${BASE_URL}/api/listings/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(listingPayload)
    });
    const d3 = Date.now() - t3;
    const listingId = createRes.data?.listing?.id || createRes.data?.listing?._id;
    if (createRes.status === 201 && listingId) {
      console.log(`  ✓ Listing created successfully with HTTP 201 (${d3}ms)`);
      console.log(`    Listing ID: ${listingId}`);
      console.log(`    Category: ${createRes.data.listing.category}, Currency: ${createRes.data.listing.currency}`);
      steps.push({ step: 4, name: 'Publish service listing', status: 'PASS', httpStatus: 201, timeMs: d3 });
    } else {
      throw new Error(`Listing create failed: ${JSON.stringify(createRes.data)}`);
    }

    // Step 5: Unauthenticated visitor retrieves catalog filtered by category
    console.log('\n[Step 5/10] Unauthenticated visitor querying /api/listings?category=digital_services...');
    const t4 = Date.now();
    const catalogRes = await fetchJson(`${BASE_URL}/api/listings?category=digital_services`);
    const d4 = Date.now() - t4;
    const found = catalogRes.data?.listings?.some(l => (l.id || l._id) === listingId);
    if (catalogRes.status === 200 && found) {
      console.log(`  ✓ Listing visible in public filtered catalog with HTTP 200 (${d4}ms)`);
      console.log(`    Total listings returned: ${catalogRes.data.listings.length}, hasMore: ${catalogRes.data.hasMore}`);
      steps.push({ step: 5, name: 'Public catalog category query', status: 'PASS', httpStatus: 200, timeMs: d4 });
    } else {
      throw new Error(`Catalog query failed or listing not found: ${JSON.stringify(catalogRes.data)}`);
    }

    // Step 6: Direct public listing retrieval
    console.log(`\n[Step 6/10] Direct public access to /api/listings/${listingId}...`);
    const t5 = Date.now();
    const itemRes = await fetchJson(`${BASE_URL}/api/listings/${listingId}`);
    const d5 = Date.now() - t5;
    if (itemRes.status === 200 && itemRes.data?.listing?.title === listingPayload.title) {
      console.log(`  ✓ Verified direct public access with HTTP 200 (${d5}ms)`);
      console.log(`    Title: "${itemRes.data.listing.title}"`);
      steps.push({ step: 6, name: 'Direct listing access', status: 'PASS', httpStatus: 200, timeMs: d5 });
    } else {
      throw new Error(`Direct get failed: ${JSON.stringify(itemRes.data)}`);
    }

    // Step 7: Seller personal listings dashboard (GET /api/listings/mine)
    console.log(`\n[Step 7/10] Seller dashboard access to /api/listings/mine...`);
    const t6 = Date.now();
    const mineRes = await fetchJson(`${BASE_URL}/api/listings/mine`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    const d6 = Date.now() - t6;
    const inMine = mineRes.data?.listings?.some(l => (l.id || l._id) === listingId);
    if (mineRes.status === 200 && inMine) {
      console.log(`  ✓ Verified seller personal listings dashboard with HTTP 200 (${d6}ms)`);
      console.log(`    Total seller listings: ${mineRes.data.listings.length}`);
      steps.push({ step: 7, name: 'Seller personal dashboard (GET /mine)', status: 'PASS', httpStatus: 200, timeMs: d6 });
    } else {
      throw new Error(`Dashboard query failed or listing not in mine: ${JSON.stringify(mineRes.data)}`);
    }

    // Step 8: In-place owner modification (PATCH)
    console.log('\n[Step 8/10] Owner in-place modification (PATCH /api/listings/:id)...');
    const t7 = Date.now();
    const updatedTitle = 'Consulenza Architettura Software, Docker & Hardening CI/CD (Aggiornato & Verificato)';
    const patchRes = await fetchJson(`${BASE_URL}/api/listings/${listingId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: updatedTitle,
        price: 0
      })
    });
    const d7 = Date.now() - t7;
    if (patchRes.status === 200) {
      console.log(`  ✓ In-place edit confirmed with HTTP 200 (${d7}ms)`);
      // Verify updated title
      const verifyRes = await fetchJson(`${BASE_URL}/api/listings/${listingId}`);
      if (verifyRes.data?.listing?.title === updatedTitle) {
        console.log(`    Verified new title persisted: "${updatedTitle}"`);
        steps.push({ step: 8, name: 'Owner in-place edit & verification', status: 'PASS', httpStatus: 200, timeMs: d7 });
      } else {
        throw new Error('Title update did not persist');
      }
    } else {
      throw new Error(`Patch failed: ${JSON.stringify(patchRes.data)}`);
    }

    // Step 9: Non-owner modification attempt (fail closed)
    console.log('\n[Step 9/10] Testing non-owner modification protection...');
    const t8 = Date.now();
    // Register another user
    const otherReg = await fetchJson(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        username: 'unauthorized-intruder',
        email: 'intruder@example.test',
        password: 'intruder-password-2026'
      })
    });
    const otherToken = otherReg.data?.data?.token || otherReg.data?.token;
    const illegalPatch = await fetchJson(`${BASE_URL}/api/listings/${listingId}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${otherToken}` },
      body: JSON.stringify({ title: 'Hacked Title' })
    });
    const d8 = Date.now() - t8;
    if (illegalPatch.status === 404 || illegalPatch.status === 403) {
      console.log(`  ✓ Unauthorized edit rejected with HTTP ${illegalPatch.status} (${d8}ms)`);
      steps.push({ step: 9, name: 'Non-owner modification guard (fail-closed)', status: 'PASS', httpStatus: illegalPatch.status, timeMs: d8 });
    } else {
      throw new Error(`Expected 403 or 404, got ${illegalPatch.status}`);
    }

    // Step 10: Direct peer-to-peer crypto agreement (BTC) without checkout fees
    console.log('\n[Step 10/10] Direct crypto agreement (BTC) listing publication without checkout fees...');
    const t9 = Date.now();
    const cryptoPayload = {
      title: 'Consulenza Architettura Distribuita & Privacy P2P',
      category: 'digital_services',
      currency: 'BTC',
      price: 0.002,
      location: 'Remoto',
      description: 'Accordo diretto peer-to-peer senza commissioni di checkout.'
    };
    const cryptoRes = await fetchJson(`${BASE_URL}/api/listings/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(cryptoPayload)
    });
    const d9 = Date.now() - t9;
    if (cryptoRes.status === 201 && cryptoRes.data?.listing?.currency === 'BTC') {
      console.log(`  ✓ Direct BTC listing created with HTTP 201 Created (${d9}ms)`);
      console.log(`    Listing ID: ${cryptoRes.data.listing.id || cryptoRes.data.listing._id}, Currency: BTC, Price: 0.002`);
      steps.push({ step: 10, name: 'Direct crypto agreement (BTC) listing', status: 'PASS', httpStatus: 201, timeMs: d9 });
    } else {
      throw new Error(`Crypto listing failed: ${JSON.stringify(cryptoRes.data)}`);
    }

    const totalElapsedSec = ((Date.now() - overallStart) / 1000).toFixed(2);

    console.log('\n================================================================');
    console.log(`✨ ALL 10/10 LIFECYCLE CHECKS PASSED (Total runtime: ${totalElapsedSec}s)`);
    console.log('================================================================');
    console.table(steps);

  } finally {
    await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
    console.log('\n[Teardown] Express server closed, database disconnected & stopped cleanly.');
  }
}

run().catch((err) => {
  console.error('\n❌ Walkthrough failed:', err);
  process.exit(1);
});

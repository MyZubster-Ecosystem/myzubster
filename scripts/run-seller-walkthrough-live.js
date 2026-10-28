'use strict';

/**
 * scripts/run-seller-walkthrough-live.js
 * Comprehensive End-to-End Live Runtime Verifier for MyZubster Seller-Free Walkthrough.
 *
 * Runs the real Express server against an isolated in-memory MongoMemoryReplSet,
 * executes the complete 15-step user journey via live HTTP requests, and outputs
 * structured verification evidence with timings and HTTP responses.
 *
 * Verifies:
 * - Authentication & seller activation lifecycle (Free Seller)
 * - Service listing publication & public catalog visibility
 * - Owner in-place editing & non-owner fail-closed security guards
 * - Commercial vs community failure states (401, 402, 400, 404)
 * - Server pagination defaults (50 vs prior 200) & load-more page traversal
 * - Mobile navigation & responsive layout asset delivery
 * - Preservation of ecosystem routes and Zorgax assistant endpoints
 */

const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const http = require('http');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'walkthrough-live-secret-2026';
process.env.PORT = '3000';

const app = require('../server');
const MarketplaceListing = require('../src/models/MarketplaceListing');

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

async function fetchText(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text().catch(() => '');
  return { status: res.status, ok: res.ok, text };
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
  console.log(`[Setup] Connected to in-memory database: ${mongoUri.replace(/:[0-9]+\//, ':*****/')}`);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3000, resolve));
  console.log('[Setup] Live Express server listening on http://127.0.0.1:3000\n');

  const BASE_URL = 'http://127.0.0.1:3000';
  const steps = [];

  try {
    // Step 1: Unauthenticated user attempt to publish (failure state guard)
    console.log('[Step 1/15] Verifying unauthenticated publish protection...');
    const t0 = Date.now();
    const unauthRes = await fetchJson(`${BASE_URL}/api/listings/create`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Unauthenticated Test' })
    });
    const d0 = Date.now() - t0;
    if (unauthRes.status === 401) {
      console.log(`  ✓ Blocked with HTTP 401 Unauthorized (${d0}ms)`);
      steps.push({ step: 1, name: 'Unauthenticated publish guard (401)', status: 'PASS', httpStatus: 401, timeMs: d0 });
    } else {
      throw new Error(`Expected 401, got ${unauthRes.status}`);
    }

    // Step 2: Register test seller
    console.log('\n[Step 2/15] Registering test seller (wasim-seller-dev)...');
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

    // Step 3: Inactive seller commercial publish guard (failure state guard)
    console.log('\n[Step 3/15] Verifying commercial publish blocked before seller activation...');
    const t2a = Date.now();
    const prematureRes = await fetchJson(`${BASE_URL}/api/listings/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Commercial Premature Offering',
        category: 'electronics',
        currency: 'EUR',
        price: 99
      })
    });
    const d2a = Date.now() - t2a;
    if (prematureRes.status === 402 && prematureRes.data?.code === 'SELLER_MEMBERSHIP_REQUIRED') {
      console.log(`  ✓ Blocked with HTTP 402 SELLER_MEMBERSHIP_REQUIRED (${d2a}ms)`);
      steps.push({ step: 3, name: 'Inactive seller commercial guard (402)', status: 'PASS', httpStatus: 402, timeMs: d2a });
    } else {
      throw new Error(`Expected 402, got ${prematureRes.status}`);
    }

    // Step 4: Missing required fields validation (failure state guard)
    console.log('\n[Step 4/15] Verifying validation guard for missing title/category...');
    const t2b = Date.now();
    const invalidRes = await fetchJson(`${BASE_URL}/api/listings/create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ price: 10 })
    });
    const d2b = Date.now() - t2b;
    if (invalidRes.status === 400) {
      console.log(`  ✓ Rejected with HTTP 400 Bad Request (${d2b}ms)`);
      steps.push({ step: 4, name: 'Invalid listing schema guard (400)', status: 'PASS', httpStatus: 400, timeMs: d2b });
    } else {
      throw new Error(`Expected 400, got ${invalidRes.status}`);
    }

    // Step 5: Activate Seller Free plan
    console.log('\n[Step 5/15] Activating Seller Free plan...');
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
      steps.push({ step: 5, name: 'Seller Free activation', status: 'PASS', httpStatus: 201, timeMs: d2 });
    } else {
      throw new Error(`Subscribe failed: ${JSON.stringify(subscribeRes.data)}`);
    }

    // Step 6: Publish text-only service listing in digital_services
    console.log('\n[Step 6/15] Publishing service listing in digital_services...');
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
      steps.push({ step: 6, name: 'Publish service listing', status: 'PASS', httpStatus: 201, timeMs: d3 });
    } else {
      throw new Error(`Listing create failed: ${JSON.stringify(createRes.data)}`);
    }

    // Step 7: Unauthenticated visitor retrieves catalog filtered by category
    console.log('\n[Step 7/15] Unauthenticated visitor querying /api/listings?category=digital_services...');
    const t4 = Date.now();
    const catalogRes = await fetchJson(`${BASE_URL}/api/listings?category=digital_services`);
    const d4 = Date.now() - t4;
    const found = catalogRes.data?.listings?.some(l => (l.id || l._id) === listingId);
    if (catalogRes.status === 200 && found) {
      console.log(`  ✓ Listing visible in public filtered catalog with HTTP 200 (${d4}ms)`);
      console.log(`    Total listings returned: ${catalogRes.data.listings.length}, hasMore: ${catalogRes.data.hasMore}`);
      steps.push({ step: 7, name: 'Public catalog category query', status: 'PASS', httpStatus: 200, timeMs: d4 });
    } else {
      throw new Error(`Catalog query failed or listing not found: ${JSON.stringify(catalogRes.data)}`);
    }

    // Step 8: Direct public listing retrieval
    console.log(`\n[Step 8/15] Direct public access to /api/listings/${listingId}...`);
    const t5 = Date.now();
    const itemRes = await fetchJson(`${BASE_URL}/api/listings/${listingId}`);
    const d5 = Date.now() - t5;
    if (itemRes.status === 200 && itemRes.data?.listing?.title === listingPayload.title) {
      console.log(`  ✓ Verified direct public access with HTTP 200 (${d5}ms)`);
      console.log(`    Title: "${itemRes.data.listing.title}"`);
      steps.push({ step: 8, name: 'Direct listing access', status: 'PASS', httpStatus: 200, timeMs: d5 });
    } else {
      throw new Error(`Direct get failed: ${JSON.stringify(itemRes.data)}`);
    }

    // Step 9: Seller personal listings dashboard (GET /api/listings/mine)
    console.log(`\n[Step 9/15] Seller dashboard access to /api/listings/mine...`);
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
      steps.push({ step: 9, name: 'Seller personal dashboard (GET /mine)', status: 'PASS', httpStatus: 200, timeMs: d6 });
    } else {
      throw new Error(`Dashboard query failed or listing not in mine: ${JSON.stringify(mineRes.data)}`);
    }

    // Step 10: In-place owner modification (PATCH)
    console.log('\n[Step 10/15] Owner in-place modification (PATCH /api/listings/:id)...');
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
      const verifyRes = await fetchJson(`${BASE_URL}/api/listings/${listingId}`);
      if (verifyRes.data?.listing?.title === updatedTitle) {
        console.log(`    Verified new title persisted: "${updatedTitle}"`);
        steps.push({ step: 10, name: 'Owner in-place edit & verification', status: 'PASS', httpStatus: 200, timeMs: d7 });
      } else {
        throw new Error('Title update did not persist');
      }
    } else {
      throw new Error(`Patch failed: ${JSON.stringify(patchRes.data)}`);
    }

    // Step 11: Non-owner modification attempt (fail closed)
    console.log('\n[Step 11/15] Testing non-owner modification protection...');
    const t8 = Date.now();
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
      steps.push({ step: 11, name: 'Non-owner modification guard (fail-closed)', status: 'PASS', httpStatus: illegalPatch.status, timeMs: d8 });
    } else {
      throw new Error(`Expected 403 or 404, got ${illegalPatch.status}`);
    }

    // Step 12: Direct peer-to-peer crypto agreement (BTC) without checkout fees
    console.log('\n[Step 12/15] Direct crypto agreement (BTC) listing publication...');
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
      steps.push({ step: 12, name: 'Direct crypto agreement (BTC) listing', status: 'PASS', httpStatus: 201, timeMs: d9 });
    } else {
      throw new Error(`Crypto listing failed: ${JSON.stringify(cryptoRes.data)}`);
    }

    // Step 13: Backward-compatible pagination & load-more traversal verification
    console.log('\n[Step 13/15] Verifying backward-compatible pagination (legacy limit=200, paginated limit=50) and stable sort...');
    const t10 = Date.now();
    // Seed 52 additional synthetic active listings to exceed 50 items (total 54 listings)
    const bulkDocs = [];
    const baseTime = Date.now();
    for (let i = 1; i <= 52; i++) {
      bulkDocs.push({
        ownerId: new mongoose.Types.ObjectId(),
        ownerUsername: `bulk-user-${i}`,
        title: `Paging Verification Item #${i}`,
        category: 'services',
        currency: 'FREE',
        price: 0,
        status: 'active',
        // Alternate identical timestamps to verify stable deterministic tie-breaking on _id
        createdAt: new Date(baseTime - Math.floor(i / 2) * 1000)
      });
    }
    await MarketplaceListing.insertMany(bulkDocs);

    // 1. Legacy unpaginated caller (no limit, page, or skip passed) retains limit=200 and returns all items
    const legacyRes = await fetchJson(`${BASE_URL}/api/listings`);
    // 2. Explicitly paginated caller (passes page=1 or page=2) defaults to limit=50
    const page1Res = await fetchJson(`${BASE_URL}/api/listings?page=1`);
    const page2Res = await fetchJson(`${BASE_URL}/api/listings?page=2`);
    const d10 = Date.now() - t10;

    const page1Ids = new Set((page1Res.data?.listings || []).map(l => l.id || l._id));
    const page2Ids = new Set((page2Res.data?.listings || []).map(l => l.id || l._id));
    const overlap = [...page1Ids].filter(id => page2Ids.has(id));

    if (
      legacyRes.status === 200 &&
      legacyRes.data?.limit === 200 &&
      legacyRes.data?.count === 54 &&
      legacyRes.data?.hasMore === false &&
      page1Res.status === 200 &&
      page1Res.data?.limit === 50 &&
      page1Res.data?.count === 50 &&
      page1Res.data?.hasMore === true &&
      page2Res.status === 200 &&
      page2Res.data?.page === 2 &&
      page2Res.data?.count === 4 &&
      page2Res.data?.hasMore === false &&
      overlap.length === 0
    ) {
      console.log(`  ✓ Legacy unpaginated query preserved default limit=200 (returned all ${legacyRes.data.count}/54 items, hasMore: false)`);
      console.log(`  ✓ Paginated query defaulted to limit=50 (page 1 count: 50, hasMore: true; page 2 count: 4, hasMore: false)`);
      console.log(`  ✓ Stable secondary sort on _id verified across pages (0 overlapping items in pagination tie-break)`);
      steps.push({ step: 13, name: 'Backward-compatible pagination & stable sort', status: 'PASS', httpStatus: 200, timeMs: d10 });
    } else {
      throw new Error(`Pagination verification failed: legacyCount=${legacyRes.data?.count}, p1Count=${page1Res.data?.count}, p2Count=${page2Res.data?.count}, overlap=${overlap.length}`);
    }

    // Step 14: Mobile navigation & responsive layout asset delivery
    console.log('\n[Step 14/15] Verifying mobile navigation & responsive layout delivery...');
    const t11 = Date.now();
    const marketHtml = await fetchText(`${BASE_URL}/community-marketplace.html`);
    const d11 = Date.now() - t11;

    const hasViewport = marketHtml.text.includes('name="viewport"') && marketHtml.text.includes('width=device-width');
    const hasLoadMoreBtn = marketHtml.text.includes('loadMoreBtn');
    const hasResponsiveNav = marketHtml.text.includes('class="tabs"') && marketHtml.text.includes('class="grid"');

    if (marketHtml.status === 200 && hasViewport && hasLoadMoreBtn && hasResponsiveNav) {
      console.log(`  ✓ Verified mobile viewport meta tag, loadMoreBtn, and responsive grid (${d11}ms)`);
      steps.push({ step: 14, name: 'Mobile navigation & responsive asset delivery', status: 'PASS', httpStatus: 200, timeMs: d11 });
    } else {
      throw new Error(`Mobile responsiveness check failed: viewport=${hasViewport}, loadMoreBtn=${hasLoadMoreBtn}, nav=${hasResponsiveNav}`);
    }

    // Step 15: Preservation of ecosystem & Zorgax routes
    console.log('\n[Step 15/15] Verifying preservation of ecosystem & Zorgax routes...');
    const t12 = Date.now();
    const zorgaxRes = await fetchJson(`${BASE_URL}/api/zorgax/assistant/status`);
    const gardensRes = await fetchJson(`${BASE_URL}/api/gardens`);
    const d12 = Date.now() - t12;

    const zorgaxPreserved = zorgaxRes.status === 200 && (zorgaxRes.data?.ok === true || zorgaxRes.data?.status === 'online');
    const gardensPreserved = gardensRes.status === 200 || gardensRes.status === 304;

    if (zorgaxPreserved && gardensPreserved) {
      console.log(`  ✓ /api/zorgax/assistant/status preserved (HTTP ${zorgaxRes.status}, status: ${zorgaxRes.data?.status || 'ok'})`);
      console.log(`  ✓ /api/gardens preserved (HTTP ${gardensRes.status})`);
      steps.push({ step: 15, name: 'Preserved ecosystem & Zorgax routes', status: 'PASS', httpStatus: 200, timeMs: d12 });
    } else {
      throw new Error(`Ecosystem route regression: zorgax=${zorgaxRes.status}, gardens=${gardensRes.status}`);
    }

    const totalElapsedSec = ((Date.now() - overallStart) / 1000).toFixed(2);

    console.log('\n================================================================');
    console.log(`✨ ALL 15/15 LIFECYCLE CHECKS PASSED (Total runtime: ${totalElapsedSec}s)`);
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

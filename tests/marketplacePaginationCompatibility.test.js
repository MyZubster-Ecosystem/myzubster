'use strict';

/**
 * tests/marketplacePaginationCompatibility.test.js
 * Regression tests for GET /api/listings backward compatibility and deterministic tie-breaking.
 *
 * Verifies maintainer review directives:
 * 1. Legacy unpaginated callers (no limit/page/skip) retain the default limit of 200 items,
 *    preventing silent loss of listings when >50 items are active.
 * 2. Paginated callers (providing page or limit) default to limit=50 with correct hasMore indicators.
 * 3. Secondary sort on _id provides deterministic pagination tie-breaking when createdAt matches.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'pagination-test-secret';

const app = require('../server');
const MarketplaceListing = require('../src/models/MarketplaceListing');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());

  // Insert 75 listings to exceed the 50-item paginated default
  const baseTime = Date.now();
  const bulk = [];
  for (let i = 1; i <= 75; i++) {
    bulk.push({
      ownerId: new mongoose.Types.ObjectId(),
      ownerUsername: `compat-user-${i}`,
      title: `Listing Item #${i.toString().padStart(3, '0')}`,
      category: 'digital_services',
      currency: 'FREE',
      price: 0,
      status: 'active',
      // Intentionally share identical createdAt timestamps across pairs to verify _id tie-breaking
      createdAt: new Date(baseTime - Math.floor(i / 3) * 1000)
    });
  }
  await MarketplaceListing.insertMany(bulk);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) {
    await mongo.stop();
  }
});

describe('GET /api/listings Pagination Compatibility & Regression Suite', () => {
  test('Legacy caller without pagination parameters receives all 75 items up to default limit of 200', async () => {
    const res = await request(app)
      .get('/api/listings')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.limit).toBe(200);
    expect(res.body.total).toBe(75);
    expect(res.body.count).toBe(75);
    expect(res.body.hasMore).toBe(false);
    expect(res.body.listings).toHaveLength(75);
  });

  test('Paginated caller with page=1 receives 50 items and hasMore: true', async () => {
    const res = await request(app)
      .get('/api/listings?page=1')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.limit).toBe(50);
    expect(res.body.page).toBe(1);
    expect(res.body.total).toBe(75);
    expect(res.body.count).toBe(50);
    expect(res.body.hasMore).toBe(true);
    expect(res.body.listings).toHaveLength(50);
  });

  test('Paginated caller with page=2 receives remaining 25 items and hasMore: false', async () => {
    const res = await request(app)
      .get('/api/listings?page=2')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.limit).toBe(50);
    expect(res.body.page).toBe(2);
    expect(res.body.total).toBe(75);
    expect(res.body.count).toBe(25);
    expect(res.body.hasMore).toBe(false);
    expect(res.body.listings).toHaveLength(25);
  });

  test('Deterministic secondary sort on _id guarantees no duplicate or missing items across pages', async () => {
    const p1 = await request(app).get('/api/listings?page=1').expect(200);
    const p2 = await request(app).get('/api/listings?page=2').expect(200);

    const ids1 = p1.body.listings.map(l => l.id || l._id);
    const ids2 = p2.body.listings.map(l => l.id || l._id);

    // No overlap between page 1 and page 2
    const overlap = ids1.filter(id => ids2.includes(id));
    expect(overlap).toHaveLength(0);

    // Combined unique items equal the exact total
    const allIds = new Set([...ids1, ...ids2]);
    expect(allIds.size).toBe(75);
  });

  test('Custom explicit limit is respected up to 200 items', async () => {
    const res = await request(app)
      .get('/api/listings?limit=6')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.limit).toBe(6);
    expect(res.body.count).toBe(6);
    expect(res.body.hasMore).toBe(true);
  });
});

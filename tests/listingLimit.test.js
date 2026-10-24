const fs = require('fs');
const path = require('path');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'listing-limit-test-secret';

const app = require('../server');
const MarketplaceListing = require('../src/models/MarketplaceListing');

describe('listing query limit and pagination verification (PR #1627)', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../src/routes/listingRoutes.js'), 'utf8');

  test('validates and applies server-side query limit with max 100 and default 50', () => {
    expect(routes).toContain('limit:rawLimit');
    expect(routes).toContain('const parsedLimit=parseInt(rawLimit,10)');
    expect(routes).toContain('Number.isFinite(parsedLimit)&&parsedLimit>0?Math.min(parsedLimit,100):50');
    expect(routes).toContain('.limit(limit)');
  });

  test('supports pagination with page, skip, total, and hasMore', () => {
    expect(routes).toContain('page:rawPage');
    expect(routes).toContain('skip:rawSkip');
    expect(routes).toContain('hasMore:skip+listings.length<total');
    expect(routes).toContain('.skip(skip).limit(limit)');
  });

  test('featured services on homepage requests limit=6', () => {
    const appSource = fs.readFileSync(path.join(__dirname, '../frontend/src/App.js'), 'utf8');
    expect(appSource).toContain("fetch('/api/listings?limit=6')");
  });

  describe('live endpoint execution', () => {
    let mongo;

    beforeAll(async () => {
      mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
      await mongoose.connect(mongo.getUri());

      // Create 9 active test listings to verify limit=6 and page=2
      const listingsData = [];
      for (let i = 1; i <= 9; i++) {
        listingsData.push({
          ownerId: new mongoose.Types.ObjectId(),
          ownerUsername: `seller-${i}`,
          title: `Service Listing ${i}`,
          category: i % 2 === 0 ? 'digital_services' : 'services',
          currency: 'EUR',
          price: 10 * i,
          status: 'active',
          description: `Description for service ${i}`,
          location: 'Remoto'
        });
      }
      await MarketplaceListing.insertMany(listingsData);
    });

    afterAll(async () => {
      await mongoose.disconnect();
      if (mongo) await mongo.stop();
    });

    test('homepage limit=6 request bounds results to at most 6 listings', async () => {
      const res = await request(app).get('/api/listings?limit=6');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.limit).toBe(6);
      expect(res.body.count).toBe(6);
      expect(res.body.total).toBe(9);
      expect(res.body.hasMore).toBe(true);
      expect(res.body.listings).toHaveLength(6);
    });

    test('page=2 request retrieves the remaining 3 older listings with hasMore=false', async () => {
      const res = await request(app).get('/api/listings?limit=6&page=2');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.limit).toBe(6);
      expect(res.body.page).toBe(2);
      expect(res.body.count).toBe(3);
      expect(res.body.total).toBe(9);
      expect(res.body.hasMore).toBe(false);
      expect(res.body.listings).toHaveLength(3);
    });

    test('category filter with limit bounds correctly for filtered subset', async () => {
      const res = await request(app).get('/api/listings?category=digital_services&limit=6');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBe(4);
      expect(res.body.count).toBe(4);
      expect(res.body.hasMore).toBe(false);
      expect(res.body.listings.every(l => l.category === 'digital_services')).toBe(true);
    });
  });
});


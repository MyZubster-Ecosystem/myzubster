const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'marketplace-seller-free-e2e-secret';

const app = require('../server');
const User = require('../src/models/User');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const MarketplaceOrder = require('../src/models/MarketplaceOrder');

let mongo;
let seller;
let sellerToken;
let buyer;
let buyerToken;

const SYNTHETIC_PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), // PNG magic bytes
  Buffer.alloc(120, 0x5A) // synthetic payload (> 64 bytes)
]);

function tokenFor(user) {
  return jwt.sign(
    { userId: String(user._id), username: user.username, role: user.role || 'user' },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

beforeAll(async () => {
  mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(mongo.getUri());

  seller = await User.create({
    username: 'e2e-seller-giulia',
    email: 'giulia-seller@myzubster.test',
    password: 'secure-test-password'
  });
  sellerToken = tokenFor(seller);

  buyer = await User.create({
    username: 'e2e-buyer-marco',
    email: 'marco-buyer@myzubster.test',
    password: 'secure-test-password'
  });
  buyerToken = tokenFor(buyer);
}, 30000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}, 30000);

describe('Marketplace End-to-End Seller Free Lifecycle & Ad Posting (#1612, #1613, #1626)', () => {
  let uploadedImageUrl;
  let createdListingId;
  let orderId;

  test('1. Before Seller Free activation: image upload is guarded (403 SELLER_REQUIRED)', async () => {
    const res = await request(app)
      .post('/api/listings/images/upload')
      .set('Authorization', `Bearer ${sellerToken}`)
      .set('Content-Type', 'image/png')
      .send(SYNTHETIC_PNG);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('SELLER_REQUIRED');
  });

  test('2. Seller activates Seller Free plan (POST /api/marketplace/seller/subscribe)', async () => {
    const res = await request(app)
      .post('/api/marketplace/seller/subscribe')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.membership).toBeDefined();
    expect(res.body.membership.status).toBe('ACTIVE');
    expect(res.body.membership.plan).toBe('SELLER_FREE');
  });

  test('3. Seller uploads listing photo with validated PNG magic bytes (POST /api/listings/images/upload)', async () => {
    const res = await request(app)
      .post('/api/listings/images/upload')
      .set('Authorization', `Bearer ${sellerToken}`)
      .set('Content-Type', 'image/png')
      .send(SYNTHETIC_PNG);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.image).toBeDefined();
    expect(res.body.image.url).toMatch(/^https?:\/\//);
    expect(res.body.image.format).toBe('png');
    expect(res.body.image.mimeType).toBe('image/png');

    uploadedImageUrl = res.body.image.url;
  });

  test('4. Seller publishes 3-step listing with photo (POST /api/listings/create)', async () => {
    const listingPayload = {
      title: 'Riparazione Biciclette e Manutenzione Rapida',
      category: 'tools',
      currency: 'EUR',
      price: 25,
      location: 'Rimini Marina Centro',
      description: 'Manutenzione bici, cambio camere d aria e regolazione freni a domicilio.',
      exchangeMode: 'payment',
      images: [
        {
          url: uploadedImageUrl,
          alt: 'Officina riparazione bici Rimini'
        }
      ]
    };

    const res = await request(app)
      .post('/api/listings/create')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(listingPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.listing).toBeDefined();
    expect(res.body.listing.title).toBe(listingPayload.title);
    expect(res.body.listing.price).toBe(25);
    expect(res.body.listing.currency).toBe('EUR');
    expect(res.body.listing.images).toHaveLength(1);
    expect(res.body.listing.images[0].url).toBe(uploadedImageUrl);

    createdListingId = res.body.listing.id || res.body.listing._id;
  });

  test('5. Public Buyer discovers the listing and verifies image persistence (GET /api/listings)', async () => {
    const res = await request(app)
      .get('/api/listings');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.listings)).toBe(true);

    const found = res.body.listings.find(item => String(item.id || item._id) === String(createdListingId));
    expect(found).toBeDefined();
    expect(found.title).toBe('Riparazione Biciclette e Manutenzione Rapida');
    expect(found.location).toBe('Rimini Marina Centro');
    expect(found.images).toHaveLength(1);
    expect(found.images[0].url).toBe(uploadedImageUrl);
  });

  test('6. Reopening & Persistence: Public directly fetches GET /api/listings/:id', async () => {
    const res = await request(app)
      .get(`/api/listings/${createdListingId}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.listing).toBeDefined();
    expect(res.body.listing.title).toBe('Riparazione Biciclette e Manutenzione Rapida');
    expect(res.body.listing.images[0].url).toBe(uploadedImageUrl);
  });

  test('7. Stored image retrieval: GET image path serves original binary PNG bytes', async () => {
    // Extract path from uploadedImageUrl
    const parsed = new URL(uploadedImageUrl);
    const imagePath = parsed.pathname;

    const res = await request(app)
      .get(imagePath);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.body).toEqual(SYNTHETIC_PNG);
  });

  test('8. Buyer requests / orders the service (POST /api/marketplace/orders)', async () => {
    const orderPayload = {
      listingId: String(createdListingId),
      quantity: 1,
      note: 'Vorrei prenotare la riparazione per domani mattina.'
    };

    const res = await request(app)
      .post('/api/marketplace/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send(orderPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.status).toBe('REQUESTED');

    orderId = res.body.order._id;
  });

  test('9. Seller accepts the buyer request (PATCH /api/marketplace/orders/:id/status)', async () => {
    const res = await request(app)
      .patch(`/api/marketplace/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ status: 'ACCEPTED' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order.status).toBe('ACCEPTED');
  });
});

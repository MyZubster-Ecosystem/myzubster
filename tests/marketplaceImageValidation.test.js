const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'marketplace-image-test-secret';

const app = require('../server');
const User = require('../src/models/User');
const SellerMembership = require('../src/models/SellerMembership');
const MarketplaceListing = require('../src/models/MarketplaceListing');
const {
  detectImageFormat,
  validateImageBuffer,
  normalizeListingImages,
  MAX_IMAGE_SIZE_BYTES,
  MIN_IMAGE_SIZE_BYTES,
  MAX_IMAGES_PER_LISTING
} = require('../src/services/imageValidationService');

// Synthetic valid image buffers
const SYNTHETIC_JPEG = Buffer.concat([Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]), Buffer.alloc(60, 0xAA)]);
const SYNTHETIC_PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), Buffer.alloc(60, 0xBB)]);
const SYNTHETIC_WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x24, 0x00, 0x00, 0x00]), Buffer.from('WEBPVP8 '), Buffer.alloc(60, 0xCC)]);

describe('ImageValidationService Unit Tests', () => {
  describe('detectImageFormat', () => {
    test('detects valid JPEG magic bytes', () => {
      const res = detectImageFormat(SYNTHETIC_JPEG);
      expect(res).toEqual({ format: 'jpeg', mimeType: 'image/jpeg', extension: 'jpg' });
    });

    test('detects valid PNG magic bytes', () => {
      const res = detectImageFormat(SYNTHETIC_PNG);
      expect(res).toEqual({ format: 'png', mimeType: 'image/png', extension: 'png' });
    });

    test('detects valid WebP magic bytes', () => {
      const res = detectImageFormat(SYNTHETIC_WEBP);
      expect(res).toEqual({ format: 'webp', mimeType: 'image/webp', extension: 'webp' });
    });

    test('returns null for HTML/SVG spoofed as image', () => {
      const htmlBuffer = Buffer.from('<html><body><script>alert("hack")</script></body></html>');
      expect(detectImageFormat(htmlBuffer)).toBeNull();
    });

    test('returns null for executable file headers (MZ / ELF)', () => {
      const mzBuffer = Buffer.concat([Buffer.from('MZ\x90\x00\x03\x00\x00\x00'), Buffer.alloc(40)]);
      expect(detectImageFormat(mzBuffer)).toBeNull();
    });

    test('returns null for undersized buffers', () => {
      expect(detectImageFormat(Buffer.from([0xFF, 0xD8]))).toBeNull();
    });
  });

  describe('validateImageBuffer', () => {
    test('passes for valid JPEG buffer matching declared type', () => {
      const result = validateImageBuffer(SYNTHETIC_JPEG, 'image/jpeg');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('jpeg');
      expect(result.mimeType).toBe('image/jpeg');
      expect(result.extension).toBe('jpg');
    });

    test('passes for valid PNG buffer matching declared type', () => {
      const result = validateImageBuffer(SYNTHETIC_PNG, 'image/png');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('png');
    });

    test('passes for valid WebP buffer matching declared type', () => {
      const result = validateImageBuffer(SYNTHETIC_WEBP, 'image/webp');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('webp');
    });

    test('rejects empty buffer', () => {
      expect(() => validateImageBuffer(Buffer.alloc(0))).toThrow(/nessun dato/i);
    });

    test('rejects undersized buffer', () => {
      expect(() => validateImageBuffer(Buffer.alloc(10))).toThrow(/troppo piccolo/i);
    });

    test('rejects oversized buffer', () => {
      const oversize = Buffer.alloc(MAX_IMAGE_SIZE_BYTES + 1);
      expect(() => validateImageBuffer(oversize)).toThrow(/troppo grande/i);
    });

    test('rejects spoofed HTML/SVG disguised with image Content-Type', () => {
      const spoofed = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>           ');
      expect(() => validateImageBuffer(spoofed, 'image/png')).toThrow(/non supportato o intestazione binaria non valida/i);
    });

    test('rejects MIME type mismatch (declared JPEG, but content is PNG)', () => {
      expect(() => validateImageBuffer(SYNTHETIC_PNG, 'image/jpeg')).toThrow(/non corrisponde/i);
    });

    test('allows application/octet-stream fallback if magic bytes match supported format', () => {
      const result = validateImageBuffer(SYNTHETIC_JPEG, 'application/octet-stream');
      expect(result.valid).toBe(true);
      expect(result.format).toBe('jpeg');
    });
  });

  describe('normalizeListingImages', () => {
    test('caps image array to MAX_IMAGES_PER_LISTING (5)', () => {
      const input = Array.from({ length: 10 }, (_, i) => ({
        url: `https://example.com/photo-${i}.jpg`,
        alt: `Photo ${i}`
      }));
      const normalized = normalizeListingImages(input, 'Default Title');
      expect(normalized).toHaveLength(MAX_IMAGES_PER_LISTING);
      expect(normalized[0].url).toBe('https://example.com/photo-0.jpg');
      expect(normalized[4].url).toBe('https://example.com/photo-4.jpg');
    });

    test('rejects non-HTTPS URLs or insecure schemes', () => {
      const input = [
        { url: 'http://insecure.example.com/photo.jpg', alt: 'HTTP' },
        { url: 'javascript:alert(1)', alt: 'XSS' },
        { url: 'data:image/png;base64,AAAA', alt: 'Data URI' },
        { url: 'https://secure.example.com/valid.jpg', alt: 'Valid' }
      ];
      const normalized = normalizeListingImages(input);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].url).toBe('https://secure.example.com/valid.jpg');
    });

    test('truncates alt text to 160 characters and applies fallback', () => {
      const longAlt = 'a'.repeat(300);
      const input = [
        { url: 'https://example.com/1.jpg', alt: longAlt },
        { url: 'https://example.com/2.jpg' } // missing alt
      ];
      const normalized = normalizeListingImages(input, 'Fallback Listing Title');
      expect(normalized[0].alt).toHaveLength(160);
      expect(normalized[1].alt).toBe('Fallback Listing Title');
    });

    test('returns empty array for invalid inputs', () => {
      expect(normalizeListingImages(null)).toEqual([]);
      expect(normalizeListingImages(undefined)).toEqual([]);
      expect(normalizeListingImages('not an array')).toEqual([]);
    });

    test('enforces seller image ownership on local upload endpoints and prevents referencing others images', () => {
      const sellerId = 'seller_12345';
      const input = [
        { url: `/api/listings/images/${sellerId}/my-seed.jpg`, alt: 'My Image' },
        { url: '/api/listings/images/other_seller_999/stolen-seed.jpg', alt: 'Stolen Image' }
      ];
      const normalized = normalizeListingImages(input, 'Fallback', { ownerId: sellerId });
      expect(normalized).toHaveLength(1);
      expect(normalized[0].url).toBe(`/api/listings/images/${sellerId}/my-seed.jpg`);
    });

    test('rejects loopback and private IP addresses in external URLs', () => {
      const input = [
        { url: 'https://localhost/secret.png' },
        { url: 'https://127.0.0.1/private.png' },
        { url: 'https://192.168.1.1/router.png' },
        { url: 'https://10.0.0.1/internal.png' },
        { url: 'https://cdn.example.org/photo.webp', alt: 'Valid external' }
      ];
      const normalized = normalizeListingImages(input);
      expect(normalized).toHaveLength(1);
      expect(normalized[0].url).toBe('https://cdn.example.org/photo.webp');
    });

    test('rejects external URLs when strictPlatformOnly is enabled', () => {
      const sellerId = 'seller_12345';
      const input = [
        { url: `/api/listings/images/${sellerId}/photo.jpg` },
        { url: 'https://cdn.example.org/photo.webp' }
      ];
      const normalized = normalizeListingImages(input, 'Fallback', { ownerId: sellerId, strictPlatformOnly: true });
      expect(normalized).toHaveLength(1);
      expect(normalized[0].url).toBe(`/api/listings/images/${sellerId}/photo.jpg`);
    });

    test('rejects Vercel Blob URLs with missing or mismatched owner segment when ownerId is specified', () => {
      const sellerId = 'seller_12345';
      const input = [
        { url: 'https://store.public.blob.vercel-storage.com/marketplace/unowned_file.jpg' },
        { url: 'https://store.public.blob.vercel-storage.com/marketplace/other_user/photo.jpg' },
        { url: `https://store.public.blob.vercel-storage.com/marketplace/${sellerId}/valid.jpg` }
      ];
      const normalized = normalizeListingImages(input, 'Fallback', { ownerId: sellerId });
      expect(normalized).toHaveLength(1);
      expect(normalized[0].url).toBe(`https://store.public.blob.vercel-storage.com/marketplace/${sellerId}/valid.jpg`);
    });

    test('enforces verifiedUploadUrls set and rejects unverified platform/blob URLs', () => {
      const sellerId = 'seller_12345';
      const verifiedUrl = `https://store.public.blob.vercel-storage.com/marketplace/${sellerId}/verified.jpg`;
      const unverifiedUrl = `https://store.public.blob.vercel-storage.com/marketplace/${sellerId}/unverified.jpg`;
      const input = [
        { url: verifiedUrl },
        { url: unverifiedUrl }
      ];
      const verifiedUploadUrls = new Set([verifiedUrl]);
      const normalized = normalizeListingImages(input, 'Fallback', { ownerId: sellerId, verifiedUploadUrls });
      expect(normalized).toHaveLength(1);
      expect(normalized[0].url).toBe(verifiedUrl);
    });
  });
});

describe('Marketplace Photo Upload & Route Integration Tests', () => {
  let mongo;
  let sellerUser;
  let nonSellerUser;

  function tokenFor(user) {
    return jwt.sign(
      { userId: String(user._id), username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  beforeAll(async () => {
    mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    await mongoose.connect(mongo.getUri());

    sellerUser = await User.create({
      username: 'active_seller',
      email: 'seller@example.test',
      password: 'test-password-123',
      role: 'user'
    });

    // Grant active seller membership
    await SellerMembership.create({
      userId: sellerUser._id,
      plan: 'SELLER_FREE',
      status: 'ACTIVE',
      activatedAt: new Date()
    });

    nonSellerUser = await User.create({
      username: 'regular_user',
      email: 'regular@example.test',
      password: 'test-password-123',
      role: 'user'
    });
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
    const fs = require('fs');
    const path = require('path');
    const testUploadDir = path.join(__dirname, '../data/uploads');
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
  }, 30000);

  describe('POST /api/listings/images/upload', () => {
    test('rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/listings/images/upload')
        .set('Content-Type', 'image/jpeg')
        .send(SYNTHETIC_JPEG);
      expect(res.status).toBe(401);
    });

    test('rejects non-seller users with 403 SELLER_REQUIRED', async () => {
      const res = await request(app)
        .post('/api/listings/images/upload')
        .set('Authorization', `Bearer ${tokenFor(nonSellerUser)}`)
        .set('Content-Type', 'image/jpeg')
        .send(SYNTHETIC_JPEG);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('SELLER_REQUIRED');
    });

    test('allows active sellers to upload valid JPEG', async () => {
      const res = await request(app)
        .post('/api/listings/images/upload')
        .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
        .set('Content-Type', 'image/jpeg')
        .send(SYNTHETIC_JPEG);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.image).toBeDefined();
      expect(res.body.image.url).toMatch(/^https?:\/\//);
      expect(res.body.image.format).toBe('jpeg');
      expect(res.body.image.mimeType).toBe('image/jpeg');
    });

    test('ignores untrusted x-forwarded-proto when trust proxy is not enabled', async () => {
      app.set('trust proxy', false);
      const res = await request(app)
        .post('/api/listings/images/upload')
        .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
        .set('Content-Type', 'image/jpeg')
        .set('X-Forwarded-Proto', 'https')
        .send(SYNTHETIC_JPEG);
      expect(res.status).toBe(201);
      // Since connection is plain HTTP and trust proxy is false, protocol must remain http
      expect(res.body.image.url).toMatch(/^http:\/\//);
    });

    test('honors x-forwarded-proto when trust proxy is enabled', async () => {
      app.set('trust proxy', true);
      try {
        const res = await request(app)
          .post('/api/listings/images/upload')
          .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
          .set('Content-Type', 'image/jpeg')
          .set('X-Forwarded-Proto', 'https')
          .send(SYNTHETIC_JPEG);
        expect(res.status).toBe(201);
        expect(res.body.image.url).toMatch(/^https:\/\//);
      } finally {
        app.set('trust proxy', false);
      }
    });

    test('returns 503 STORAGE_CONFIGURATION_ERROR in production when Blob token is missing', async () => {
      const prevEnv = process.env.NODE_ENV;
      const prevToken = process.env.BLOB_READ_WRITE_TOKEN;
      try {
        process.env.NODE_ENV = 'production';
        delete process.env.BLOB_READ_WRITE_TOKEN;

        const res = await request(app)
          .post('/api/listings/images/upload')
          .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
          .set('Content-Type', 'image/jpeg')
          .send(SYNTHETIC_JPEG);
        expect(res.status).toBe(503);
        expect(res.body.code).toBe('STORAGE_CONFIGURATION_ERROR');
      } finally {
        process.env.NODE_ENV = prevEnv;
        if (prevToken) process.env.BLOB_READ_WRITE_TOKEN = prevToken;
      }
    });

    test('returns 503 STORAGE_CONFIGURATION_ERROR in Vercel preview environments (VERCEL=1) when Blob token is missing', async () => {
      const prevVercel = process.env.VERCEL;
      const prevToken = process.env.BLOB_READ_WRITE_TOKEN;
      try {
        process.env.VERCEL = '1';
        delete process.env.BLOB_READ_WRITE_TOKEN;

        const res = await request(app)
          .post('/api/listings/images/upload')
          .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
          .set('Content-Type', 'image/jpeg')
          .send(SYNTHETIC_JPEG);
        expect(res.status).toBe(503);
        expect(res.body.code).toBe('STORAGE_CONFIGURATION_ERROR');
      } finally {
        if (prevVercel !== undefined) process.env.VERCEL = prevVercel;
        else delete process.env.VERCEL;
        if (prevToken) process.env.BLOB_READ_WRITE_TOKEN = prevToken;
      }
    });

    test('allows active sellers to upload valid PNG', async () => {
      const res = await request(app)
        .post('/api/listings/images/upload')
        .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
        .set('Content-Type', 'image/png')
        .send(SYNTHETIC_PNG);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.image.format).toBe('png');
    });

    test('allows active sellers to upload valid WebP', async () => {
      const res = await request(app)
        .post('/api/listings/images/upload')
        .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
        .set('Content-Type', 'image/webp')
        .send(SYNTHETIC_WEBP);
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.image.format).toBe('webp');
    });

    test('rejects spoofed payload with 415 INVALID_IMAGE_MAGIC_BYTES', async () => {
      const spoofedPayload = Buffer.from('<html><body><script>maliciousCode()</script></body></html>');
      const res = await request(app)
        .post('/api/listings/images/upload')
        .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
        .set('Content-Type', 'image/jpeg')
        .send(spoofedPayload);
      expect(res.status).toBe(415);
      expect(res.body.code).toBe('INVALID_IMAGE_MAGIC_BYTES');
    });

    test('rejects MIME mismatch with 415 MIME_TYPE_MISMATCH', async () => {
      const res = await request(app)
        .post('/api/listings/images/upload')
        .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
        .set('Content-Type', 'image/jpeg')
        .send(SYNTHETIC_PNG); // Declared JPEG, but content is PNG
      expect(res.status).toBe(415);
      expect(res.body.code).toBe('MIME_TYPE_MISMATCH');
    });

    test('persists uploaded image and allows retrieval via GET /api/listings/images/:userId/:filename', async () => {
      const uploadRes = await request(app)
        .post('/api/listings/images/upload')
        .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
        .set('Content-Type', 'image/jpeg')
        .send(SYNTHETIC_JPEG);
      expect(uploadRes.status).toBe(201);
      const imageUrl = uploadRes.body.image.url;

      // Extract the relative path from the returned URL
      const urlObj = new URL(imageUrl);
      const fetchRes = await request(app).get(urlObj.pathname);
      expect(fetchRes.status).toBe(200);
      expect(fetchRes.headers['content-type']).toBe('image/jpeg');
      expect(fetchRes.headers['x-content-type-options']).toBe('nosniff');
      expect(Buffer.compare(fetchRes.body, SYNTHETIC_JPEG)).toBe(0);
    });

    test('rejects path traversal attempts on GET /api/listings/images/:userId/:filename', async () => {
      const res = await request(app).get('/api/listings/images/../somefile.jpg');
      expect([400, 404]).toContain(res.status);

      const traversalParamRes = await request(app).get('/api/listings/images/seller123/../../etc/passwd.jpg');
      expect([400, 404]).toContain(traversalParamRes.status);
    });

    test('returns 404 for non-existent image', async () => {
      const res = await request(app).get(`/api/listings/images/${sellerUser._id}/missing-image.jpg`);
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Listing Lifecycle with Images (create & patch)', () => {
    let createdListingId;

    test('POST /api/listings/create persists normalized images', async () => {
      const imagesPayload = [
        { url: 'https://images.example.test/pic1.jpg', alt: 'Pic 1' },
        { url: 'https://images.example.test/pic2.png', alt: 'Pic 2' },
        { url: 'https://images.example.test/pic3.webp' }
      ];

      const res = await request(app)
        .post('/api/listings/create')
        .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
        .send({
          title: 'Handmade Wooden Table',
          category: 'produce',
          price: 150,
          currency: 'EUR',
          description: 'Solid oak dining table crafted locally.',
          images: imagesPayload
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.listing.images).toHaveLength(3);
      expect(res.body.listing.images[0].url).toBe('https://images.example.test/pic1.jpg');
      expect(res.body.listing.images[0].alt).toBe('Pic 1');
      expect(res.body.listing.images[2].alt).toBe('Handmade Wooden Table'); // fallback applied
      createdListingId = res.body.listing.id;
    });

    test('POST /api/listings/create truncates images > 5', async () => {
      const eightImages = Array.from({ length: 8 }, (_, i) => ({
        url: `https://images.example.test/item-${i}.jpg`,
        alt: `Item ${i}`
      }));

      const res = await request(app)
        .post('/api/listings/create')
        .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
        .send({
          title: 'Craft Beer Brewkit',
          category: 'produce',
          price: 50,
          currency: 'EUR',
          description: 'Home fermentation equipment.',
          images: eightImages
        });

      expect(res.status).toBe(201);
      expect(res.body.listing.images).toHaveLength(5);
    });

    test('PATCH /api/listings/:id updates listing images', async () => {
      const updatedImages = [
        { url: 'https://images.example.test/new-cover.jpg', alt: 'New Cover Photo' }
      ];

      const res = await request(app)
        .patch(`/api/listings/${createdListingId}`)
        .set('Authorization', `Bearer ${tokenFor(sellerUser)}`)
        .send({
          title: 'Handmade Wooden Table (Updated)',
          images: updatedImages
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.listing.images).toHaveLength(1);
      expect(res.body.listing.images[0].url).toBe('https://images.example.test/new-cover.jpg');
      expect(res.body.listing.images[0].alt).toBe('New Cover Photo');
    });
  });
});

/**
 * Public Passport Integration Tests
 *
 * These tests cover the acceptance criteria described in issue #1598.
 * They use synthetic fixtures stored in the test database; no real
 * contributor data is accessed.
 *
 * Run with: npm test
 */

const request = require('supertest');
const app = require('../src/app'); // Adjust if the Express app is exported elsewhere
const consentService = require('../src/services/consentService');
const db = require('../src/db');

describe('GET /api/passports/:contributorId (public)', () => {
  const syntheticId = 'synthetic-1234';

  beforeAll(async () => {
    // Clean any leftover data
    await db('passports').where({ contributorId: syntheticId }).del();
    await db('contributor_consents').where({ contributorId: syntheticId }).del();

    // Insert a minimal passport fixture
    await db('passports').insert({
      contributorId: syntheticId,
      displayName: 'Synthetic User',
      avatarUrl: 'https://example.com/avatar.png',
      bio: 'Synthetic test fixture',
    });

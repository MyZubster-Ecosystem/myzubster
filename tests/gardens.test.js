const request = require('supertest');
const express = require('express');

jest.mock('../backend/src/services/geocoding', () => ({
  geocodeAddress: jest.fn().mockResolvedValue({
    lat: 45.4642, lng: 9.19, displayName: 'Piazza del Duomo, Milano',
    neighborhood: 'Centro Storico', city: 'Milano',
  }),
  reverseGeocode: jest.fn().mockResolvedValue({
    displayName: 'Piazza del Duomo, Milano', address: 'Piazza del Duomo, Milano',
    neighborhood: 'Centro Storico', city: 'Milano',
  }),
}));

describe('Garden Routes', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
  });
  test('placeholder - routes module loads', () => {
    const routes = require('../backend/src/routes/gardens');
    expect(typeof routes).toBe('function');
  });
  test('POST /api/gardens without name returns 400', async () => {
    const mockGarden = { create: jest.fn() };
    jest.doMock('../backend/src/models/Garden', () => mockGarden);
    const response = await request(app).post('/api/gardens').send({ address: 'Via Roma' });
    expect(response.status).toBe(400);
  });
  test('POST /api/gardens without address returns 400', async () => {
    const response = await request(app).post('/api/gardens').send({ name: 'Orto' });
    expect(response.status).toBe(400);
  });
  test('POST /api/gardens/reverse-geocode without coords returns 400', async () => {
    const response = await request(app).post('/api/gardens/reverse-geocode').send({});
    expect(response.status).toBe(400);
  });
  test('GET /api/gardens/search without params returns 400', async () => {
    const response = await request(app).get('/api/gardens/search');
    expect(response.status).toBe(400);
  });
});

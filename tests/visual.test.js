const request = require('supertest');
const app = require('../server');

describe('MyZubster Visual MVP', () => {
  it('serves the character and comic workflow at /visual', async () => {
    const response = await request(app).get('/visual');

    expect(response.statusCode).toBe(200);
    expect(response.type).toMatch(/html/);
    expect(response.text).toContain('MyZubster Visual');
    expect(response.text).toContain('Generate comic');
    expect(response.text).toContain('Download comic SVG');
    expect(response.text).toContain('Open GitHub collaboration issue');
  });
});

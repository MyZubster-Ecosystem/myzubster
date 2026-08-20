const request = require('supertest');
const app = require('../server');

describe('MyZubster Visual MVP', () => {
  it('serves the Create Character interface at /visual', async () => {
    const response = await request(app).get('/visual');

    expect(response.statusCode).toBe(200);
    expect(response.type).toMatch(/html/);
    expect(response.text).toContain('MyZubster Visual');
    expect(response.text).toContain('Create your');
    expect(response.text).toContain('Open GitHub collaboration issue');
  });
});

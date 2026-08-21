const { createSafeLookup } = require('../src/services/researchFetchers');

describe('research fetcher DNS guard', () => {
  test('rejects DNS results that resolve to private space', done => {
    const lookup = (hostname, options, callback) => callback(null, '127.0.0.1', 4);
    createSafeLookup(lookup)('example.com', {}, error => {
      expect(error).toBeTruthy();
      expect(error.message).toMatch(/private|local/i);
      done();
    });
  });

  test('accepts public DNS results', done => {
    const lookup = (hostname, options, callback) => callback(null, '93.184.216.34', 4);
    createSafeLookup(lookup)('example.com', {}, (error, address, family) => {
      expect(error).toBeNull();
      expect(address).toBe('93.184.216.34');
      expect(family).toBe(4);
      done();
    });
  });
});

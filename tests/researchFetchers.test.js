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

  test('preserves all=true result arrays for newer Node HTTP agents', done => {
    const addresses = [
      { address: '93.184.216.34', family: 4 },
      { address: '2606:2800:220:1:248:1893:25c8:1946', family: 6 },
    ];
    const lookup = (hostname, options, callback) => {
      expect(options.all).toBe(true);
      callback(null, addresses);
    };

    createSafeLookup(lookup)('example.com', { all: true }, (error, result) => {
      expect(error).toBeNull();
      expect(result).toEqual(addresses);
      done();
    });
  });

  test('rejects a private address inside all=true DNS results', done => {
    const lookup = (hostname, options, callback) => callback(null, [
      { address: '93.184.216.34', family: 4 },
      { address: '127.0.0.1', family: 4 },
    ]);

    createSafeLookup(lookup)('example.com', { all: true }, error => {
      expect(error).toBeTruthy();
      expect(error.message).toMatch(/private|local/i);
      done();
    });
  });

  test('fails closed on malformed all=true DNS results', done => {
    const lookup = (hostname, options, callback) => callback(null, [{ family: 4 }]);

    createSafeLookup(lookup)('example.com', { all: true }, error => {
      expect(error).toBeTruthy();
      expect(error.message).toMatch(/invalid address/i);
      done();
    });
  });
});

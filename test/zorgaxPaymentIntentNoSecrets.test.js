'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax payment intent remains non-custodial', () => {
  test('payment intent model contains no private-key or seed fields', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/models/ZorgaxPaymentIntent.js'), 'utf8').toLowerCase();
    expect(source).not.toContain('privatekey');
    expect(source).not.toContain('private_key');
    expect(source).not.toContain('seedphrase');
    expect(source).not.toContain('seed_phrase');
  });
});

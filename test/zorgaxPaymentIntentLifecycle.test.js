'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax payment intent lifecycle', () => {
  test('defines pending, verified, expired and rejected settlement states', () => {
    const source = fs.readFileSync(path.join(__dirname, '../src/models/ZorgaxPaymentIntent.js'), 'utf8');
    for (const state of ['PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED']) expect(source).toContain(`'${state}'`);
  });
});

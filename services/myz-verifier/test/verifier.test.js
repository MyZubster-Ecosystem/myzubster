const { validateObserved } = require('../src/verifier');

describe('MYZ independent verifier contract', () => {
  const expected = {
    txid: 'tx-123',
    recipient: 'recipient-1',
    asset: 'MYZ',
    network: 'tari-mainnet',
    amount: 25,
    transactionStatus: 'confirmed',
  };

  test('accepts an exact confirmed transaction', () => {
    const result = validateObserved(expected, { ...expected });
    expect(result).toMatchObject({
      verified: true,
      txid: expected.txid,
      recipient: expected.recipient,
      asset: 'MYZ',
      network: expected.network,
      amount: 25,
      transactionStatus: 'confirmed',
    });
    expect(result.checks).toEqual({
      txid: true,
      recipient: true,
      asset: true,
      network: true,
      amount: true,
      transactionStatus: true,
    });
  });

  test.each([
    ['txid', { txid: 'other' }],
    ['recipient', { recipient: 'other' }],
    ['asset', { asset: 'XMR' }],
    ['network', { network: 'tari-testnet' }],
    ['amount', { amount: 24 }],
    ['status', { transactionStatus: 'pending' }],
  ])('fails closed on %s mismatch', (_name, change) => {
    const result = validateObserved(expected, { ...expected, ...change });
    expect(result.verified).toBe(false);
  });

  test('rejects malformed upstream data', () => {
    expect(validateObserved(expected, null).verified).toBe(false);
    expect(validateObserved(expected, { txid: expected.txid }).verified).toBe(false);
  });
});

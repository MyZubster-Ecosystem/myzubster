const { parseVerification } = require('../src/services/paymentVerifier');

describe('payment verifier', () => {
  const request = {
    txId: 'tx-123',
    recipient: 'wallet-1',
    asset: 'MYZ',
    network: 'Tari',
    amount: 10
  };

  test('accepts an exact confirmed transaction', () => {
    const result = parseVerification({
      transaction: {
        txId: 'tx-123',
        recipient: 'wallet-1',
        asset: 'MYZ',
        network: 'Tari',
        amount: 10,
        transactionStatus: 'confirmed'
      }
    }, request);

    expect(result.valid).toBe(true);
    expect(result.checks).toEqual({
      recipient: true,
      asset: true,
      network: true,
      amount: true,
      transactionStatus: true
    });
  });

  test('rejects a transaction with a mismatched recipient', () => {
    const result = parseVerification({
      transaction: {
        txId: 'tx-123', recipient: 'attacker', asset: 'MYZ', network: 'Tari',
        amount: 10, transactionStatus: 'confirmed'
      }
    }, request);
    expect(result.valid).toBe(false);
    expect(result.checks.recipient).toBe(false);
  });

  test('rejects a pending transaction', () => {
    const result = parseVerification({
      transaction: {
        txId: 'tx-123', recipient: 'wallet-1', asset: 'MYZ', network: 'Tari',
        amount: 10, transactionStatus: 'pending'
      }
    }, request);
    expect(result.valid).toBe(false);
    expect(result.checks.transactionStatus).toBe(false);
  });
});

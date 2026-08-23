const { PAYMENT_STATES, processPayment, verificationPassed } = require('../src/services/paymentLifecycle');
function bounty(overrides = {}) { return { issueNumber: 451, prNumber: 491, rewardAmount: 10, paymentAsset: 'MYZ', paymentNetwork: 'Tari', paymentRecipient: 'recipient-1', paymentStatus: PAYMENT_STATES.PENDING, paymentTxId: null, status: 'completed', ...overrides }; }
function validVerification(txId = 'tx-1', overrides = {}) { return { valid: true, txId, transactionStatus: 'confirmed', recipient: 'recipient-1', asset: 'MYZ', network: 'Tari', amount: 10, checks: { recipient: true, asset: true, network: true, amount: true, transactionStatus: true }, ...overrides }; }
describe('payment lifecycle', () => {
  test('reconciles an existing txId without submitting a second payment', async () => { const current = bounty({ paymentStatus: PAYMENT_STATES.SUBMITTED, paymentTxId: 'tx-existing' }); const submit = jest.fn(); const verify = jest.fn().mockResolvedValue(validVerification('tx-existing')); const result = await processPayment({ bounty: current, adapter: { submit }, verifier: { verify } }); expect(submit).not.toHaveBeenCalled(); expect(verify).toHaveBeenCalledWith(expect.objectContaining({ txId: 'tx-existing', recipient: 'recipient-1', asset: 'MYZ', network: 'Tari', amount: 10 })); expect(result.state).toBe(PAYMENT_STATES.CONFIRMED); expect(current.status).toBe('paid'); });
  test('never marks a payment paid when verification bindings fail', async () => { const current = bounty({ paymentStatus: PAYMENT_STATES.SUBMITTED, paymentTxId: 'tx-existing' }); const verify = jest.fn().mockResolvedValue(validVerification('tx-existing', { recipient: 'attacker' })); const result = await processPayment({ bounty: current, adapter: { submit: jest.fn() }, verifier: { verify } }); expect(result.state).toBe(PAYMENT_STATES.FAILED); expect(current.paymentStatus).toBe(PAYMENT_STATES.FAILED); expect(current.status).not.toBe('paid'); });
  test('allows MYZ-only payment without external verifier', async () => {
    const current = bounty({ paymentAsset: 'MYZ', paymentNetwork: 'Tari', paymentRecipient: 'recipient-1' });
    const submit = jest.fn().mockResolvedValue({ txId: 'tx-myzi' });
    const result = await processPayment({ bounty: current, adapter: { submit }, verifier: null });
    expect(submit).toHaveBeenCalled();
    expect(result.state).toBe(PAYMENT_STATES.CONFIRMED);
    expect(current.status).toBe('paid');
    expect(current.paymentTxId).toBe('tx-myzi');
  });

  test('still requires an independent verifier for non-MYZ assets', async () => {
    const current = bounty({ paymentAsset: 'XMR', paymentNetwork: 'mainnet', paymentRecipient: 'recipient-1' });
    const submit = jest.fn().mockResolvedValue({ txId: 'tx-xmr' });
    await expect(processPayment({ bounty: current, adapter: { submit }, verifier: null })).rejects.toThrow('payment verifier is not configured');
    expect(submit).not.toHaveBeenCalled();
  });
  test('rejects simulated submissions even when a verifier is present', async () => { const current = bounty(); const submit = jest.fn().mockResolvedValue({ txId: 'tx-simulated', simulated: true }); const verify = jest.fn(); const result = await processPayment({ bounty: current, adapter: { submit }, verifier: { verify } }); expect(result.state).toBe(PAYMENT_STATES.FAILED); expect(verify).not.toHaveBeenCalled(); expect(current.paymentStatus).toBe(PAYMENT_STATES.FAILED); expect(current.paymentTxId).toBeNull(); });
  test('requires every verification binding to pass', () => { const request = { recipient: 'recipient-1', asset: 'MYZ', network: 'Tari', amount: 10 }; expect(verificationPassed(validVerification('tx-1'), request, 'tx-1')).toBe(true); expect(verificationPassed(validVerification('tx-1', { amount: 11 }), request, 'tx-1')).toBe(false); expect(verificationPassed(validVerification('tx-1', { transactionStatus: 'pending' }), request, 'tx-1')).toBe(false); expect(verificationPassed(validVerification('tx-2'), request, 'tx-1')).toBe(false); });
});

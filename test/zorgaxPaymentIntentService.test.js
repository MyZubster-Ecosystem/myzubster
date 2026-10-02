'use strict';

jest.mock('../src/services/zorgaxUnifiedCheckoutService', () => ({
  RETRY_DELAY_MS: 15000,
  normalizeTxid: jest.fn(value => String(value || '').trim().toLowerCase()),
  refreshPaymentIntent: jest.fn(),
  verifyAndActivatePaymentIntent: jest.fn()
}));

const unified = require('../src/services/zorgaxUnifiedCheckoutService');
const service = require('../src/services/zorgaxPaymentIntentService');

describe('Zorgax payment intent compatibility service', () => {
  beforeEach(() => jest.clearAllMocks());

  test('delegates verification and activation to the unified checkout service', async () => {
    unified.verifyAndActivatePaymentIntent.mockResolvedValue({
      intentId: 'zorgax_test',
      settlementStatus: 'VERIFIED',
      verified: true
    });
    const input = { ownerId: 'owner-1', intentId: 'zorgax_test', paymentReference: 'A'.repeat(64) };
    await expect(service.verifyAndActivatePaymentIntent(input)).resolves.toEqual(
      expect.objectContaining({ settlementStatus: 'VERIFIED', verified: true })
    );
    expect(unified.verifyAndActivatePaymentIntent).toHaveBeenCalledWith(input);
  });

  test('normalizes BTC references through the unified checkout service', () => {
    const reference = 'A'.repeat(64);
    expect(service.normalizePaymentReference('BTC', reference)).toBe(reference.toLowerCase());
    expect(unified.normalizeTxid).toHaveBeenCalledWith(reference);
  });

  test('keeps non-BTC references bounded and non-empty', () => {
    expect(service.normalizePaymentReference('ETH', '  0xabc  ')).toBe('0xabc');
    expect(() => service.normalizePaymentReference('ETH', '')).toThrow('Riferimento pagamento non valido');
    expect(() => service.normalizePaymentReference('ETH', 'x'.repeat(181))).toThrow('Riferimento pagamento non valido');
  });

  test('classifies temporary verifier failures as retryable', () => {
    expect(service.isRetryableVerificationError(new Error('Conferme blockchain insufficienti'))).toBe(true);
    expect(service.isRetryableVerificationError(new Error('Verifier BTC non disponibile'))).toBe(true);
    expect(service.isRetryableVerificationError(new Error('Pagamento rifiutato'))).toBe(false);
  });
});

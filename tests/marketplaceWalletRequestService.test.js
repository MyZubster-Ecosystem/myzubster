const { Wallet } = require('ethers');

const {
  normalizeAddress,
  createNonce
} = require('../src/services/walletSignatureService');

const {
  canonicalPayload,
  hashPayload,
  buildMarketplaceRequestMessage,
  verifyMarketplaceRequest
} = require('../src/services/marketplaceWalletRequestService');

function makePayload(walletAddress) {
  return {
    schema: 'MYZUBSTER_MARKETPLACE_REQUEST_V1',
    intent: 'MARKETPLACE_REQUEST',
    listingId: '507f1f77bcf86cd799439011',
    quantity: 2,
    buyerId: '507f191e810c19729de860ea',
    walletAddress: normalizeAddress(walletAddress),
    nonce: createNonce(),
    issuedAt: '2026-09-16T08:30:00.000Z',
    expiresAt: '2026-09-16T08:35:00.000Z'
  };
}

describe('MyZubster signed Marketplace request', () => {
  test('recovers the wallet that signed the request', async () => {
    const wallet = Wallet.createRandom();
    const payload = makePayload(wallet.address);
    const message = buildMarketplaceRequestMessage(payload);

    const signature = await wallet.signMessage(message);

    expect(verifyMarketplaceRequest(message, signature))
      .toBe(normalizeAddress(wallet.address));
  });

  test('different wallet cannot impersonate expected wallet', async () => {
    const expected = Wallet.createRandom();
    const attacker = Wallet.createRandom();

    const payload = makePayload(expected.address);
    const message = buildMarketplaceRequestMessage(payload);
    const signature = await attacker.signMessage(message);

    expect(verifyMarketplaceRequest(message, signature))
      .not.toBe(normalizeAddress(expected.address));
  });

  test('changing quantity changes payload hash', () => {
    const wallet = Wallet.createRandom();

    const original = makePayload(wallet.address);
    const altered = { ...original, quantity: original.quantity + 1 };

    expect(hashPayload(original)).not.toBe(hashPayload(altered));
  });

  test('changing listing changes payload hash', () => {
    const wallet = Wallet.createRandom();

    const original = makePayload(wallet.address);

    const altered = {
      ...original,
      listingId: '507f1f77bcf86cd799439012'
    };

    expect(hashPayload(original)).not.toBe(hashPayload(altered));
  });

  test('canonical payload is deterministic', () => {
    const wallet = Wallet.createRandom();
    const payload = makePayload(wallet.address);

    expect(canonicalPayload(payload)).toBe(canonicalPayload(payload));
    expect(hashPayload(payload)).toBe(hashPayload(payload));
  });

  test('message distinguishes request signature from payment', () => {
    const wallet = Wallet.createRandom();
    const payload = makePayload(wallet.address);

    const message = buildMarketplaceRequestMessage(payload);

    expect(message).toContain('MARKETPLACE_REQUEST');
    expect(message).toContain('does not authorize payment');
    expect(message).toContain('Payload Hash:');
  });
});

import {
  ensureVerifiedMarketplaceWallet,
  createSignedMarketplaceRequest
} from './marketplaceWalletClient';

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

function jsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  });
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('myzubster-token', 'test-jwt');

  global.fetch = jest.fn();

  window.ethereum = {
    request: jest.fn()
  };
});

afterEach(() => {
  delete window.ethereum;
  jest.restoreAllMocks();
});

test('verified wallet signs marketplace request without blockchain transaction', async () => {
  window.ethereum.request
    .mockResolvedValueOnce([ADDRESS])
    .mockResolvedValueOnce('0xmarketplacesignature');

  global.fetch
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        state: 'WALLET_VERIFIED',
        wallets: [{
          walletAddress: ADDRESS.toLowerCase(),
          status: 'VERIFIED'
        }]
      })
    )
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        challengeId: 'marketplace-challenge-1',
        message: 'Sign MyZubster Marketplace request',
        payload: {
          schema: 'MYZUBSTER_MARKETPLACE_REQUEST_V2',
          listingSnapshot: {
            price: 10,
            currency: 'EUR',
            exchangeMode: 'payment'
          }
        }
      }, 201)
    )
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        order: {
          _id: 'order-1',
          status: 'REQUESTED'
        }
      }, 201)
    );

  const onChallenge = jest.fn();

  const result = await createSignedMarketplaceRequest({
    listingId: 'listing-1',
    quantity: 1,
    note: '',
    onChallenge
  });

  expect(result.order.status).toBe('REQUESTED');
  expect(onChallenge).toHaveBeenCalledTimes(1);

  expect(window.ethereum.request).toHaveBeenNthCalledWith(1, {
    method: 'eth_requestAccounts'
  });

  expect(window.ethereum.request).toHaveBeenNthCalledWith(2, {
    method: 'personal_sign',
    params: [
      'Sign MyZubster Marketplace request',
      ADDRESS.toLowerCase()
    ]
  });

  const methods = window.ethereum.request.mock.calls.map(
    ([request]) => request.method
  );

  expect(methods).not.toContain('eth_sendTransaction');
  expect(methods).not.toContain('eth_sendRawTransaction');

  expect(global.fetch).toHaveBeenCalledTimes(3);

  const orderRequest = global.fetch.mock.calls[2];
  expect(orderRequest[0]).toBe('/api/marketplace/orders');

  const orderBody = JSON.parse(orderRequest[1].body);
  expect(orderBody).toEqual({
    listingId: 'listing-1',
    quantity: 1,
    note: '',
    challengeId: 'marketplace-challenge-1',
    signature: '0xmarketplacesignature'
  });
});

test('unverified wallet performs link challenge before marketplace signature', async () => {
  window.ethereum.request
    .mockResolvedValueOnce([ADDRESS])
    .mockResolvedValueOnce('0xlinksig')
    .mockResolvedValueOnce('0xordersig');

  global.fetch
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        state: 'WALLET_NOT_CONNECTED',
        wallets: []
      })
    )
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        challengeId: 'link-challenge-1',
        message: 'Verify wallet'
      }, 201)
    )
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        state: 'WALLET_VERIFIED'
      })
    )
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        challengeId: 'order-challenge-1',
        message: 'Sign order',
        payload: {
          schema: 'MYZUBSTER_MARKETPLACE_REQUEST_V2'
        }
      }, 201)
    )
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        order: {
          _id: 'order-2',
          status: 'REQUESTED'
        }
      }, 201)
    );

  const result = await createSignedMarketplaceRequest({
    listingId: 'listing-2'
  });

  expect(result.order.status).toBe('REQUESTED');

  expect(window.ethereum.request.mock.calls.map(
    ([request]) => request.method
  )).toEqual([
    'eth_requestAccounts',
    'personal_sign',
    'personal_sign'
  ]);

  expect(global.fetch.mock.calls.map(([url]) => url)).toEqual([
    '/api/wallet/me',
    '/api/wallet/challenge',
    '/api/wallet/verify',
    '/api/marketplace/orders/challenge',
    '/api/marketplace/orders'
  ]);
});

test('wallet signature rejection 4001 stops before order creation', async () => {
  window.ethereum.request
    .mockResolvedValueOnce([ADDRESS])
    .mockRejectedValueOnce(
      Object.assign(new Error('User rejected request'), { code: 4001 })
    );

  global.fetch
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        state: 'WALLET_VERIFIED',
        wallets: [{
          walletAddress: ADDRESS.toLowerCase()
        }]
      })
    )
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        challengeId: 'marketplace-challenge-rejected',
        message: 'Sign request',
        payload: {
          schema: 'MYZUBSTER_MARKETPLACE_REQUEST_V2'
        }
      }, 201)
    );

  await expect(
    createSignedMarketplaceRequest({
      listingId: 'listing-rejected'
    })
  ).rejects.toMatchObject({
    code: 4001
  });

  expect(global.fetch).toHaveBeenCalledTimes(2);

  expect(
    global.fetch.mock.calls.some(
      ([url]) => url === '/api/marketplace/orders'
    )
  ).toBe(false);
});

test('missing EIP-1193 provider fails before any API request', async () => {
  delete window.ethereum;

  await expect(
    ensureVerifiedMarketplaceWallet()
  ).rejects.toThrow('EVM_WALLET_NOT_AVAILABLE');

  expect(global.fetch).not.toHaveBeenCalled();
});

test('MARKETPLACE_LISTING_CHANGED is propagated to caller', async () => {
  window.ethereum.request
    .mockResolvedValueOnce([ADDRESS])
    .mockResolvedValueOnce('0xsigned');

  global.fetch
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        state: 'WALLET_VERIFIED',
        wallets: [{
          walletAddress: ADDRESS.toLowerCase()
        }]
      })
    )
    .mockImplementationOnce(() =>
      jsonResponse({
        success: true,
        challengeId: 'changed-challenge',
        message: 'Sign old economics',
        payload: {
          schema: 'MYZUBSTER_MARKETPLACE_REQUEST_V2',
          listingSnapshot: {
            price: 10,
            currency: 'EUR',
            exchangeMode: 'payment'
          }
        }
      }, 201)
    )
    .mockImplementationOnce(() =>
      jsonResponse({
        success: false,
        code: 'MARKETPLACE_LISTING_CHANGED',
        message: 'Listing economics changed'
      }, 409)
    );

  await expect(
    createSignedMarketplaceRequest({
      listingId: 'changed-listing'
    })
  ).rejects.toMatchObject({
    status: 409,
    code: 'MARKETPLACE_LISTING_CHANGED'
  });
});

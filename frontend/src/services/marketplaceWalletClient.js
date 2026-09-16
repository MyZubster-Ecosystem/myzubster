function authHeaders() {
  const token = localStorage.getItem('myzubster-token');
  if (!token) throw new Error('AUTH_REQUIRED');

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      body.message || body.code || `HTTP_${response.status}`
    );
    error.status = response.status;
    error.code = body.code;
    error.body = body;
    throw error;
  }

  return body;
}

function ethereumProvider() {
  if (!window.ethereum?.request) {
    throw new Error('EVM_WALLET_NOT_AVAILABLE');
  }
  return window.ethereum;
}

async function selectedAddress() {
  const provider = ethereumProvider();

  const accounts = await provider.request({
    method: 'eth_requestAccounts'
  });

  if (!accounts?.[0]) {
    throw new Error('EVM_WALLET_ACCOUNT_REQUIRED');
  }

  return String(accounts[0]).toLowerCase();
}

async function signMessage(message, walletAddress) {
  const provider = ethereumProvider();

  return provider.request({
    method: 'personal_sign',
    params: [message, walletAddress]
  });
}

export async function ensureVerifiedMarketplaceWallet() {
  const walletAddress = await selectedAddress();

  const current = await requestJson('/api/wallet/me');

  const alreadyVerified = (current.wallets || []).some(
    wallet =>
      String(wallet.walletAddress || wallet.address || '').toLowerCase() ===
      walletAddress
  );

  if (alreadyVerified) {
    return walletAddress;
  }

  const challenge = await requestJson('/api/wallet/challenge', {
    method: 'POST',
    body: JSON.stringify({ walletAddress })
  });

  const signature = await signMessage(
    challenge.message,
    walletAddress
  );

  const verified = await requestJson('/api/wallet/verify', {
    method: 'POST',
    body: JSON.stringify({
      challengeId: challenge.challengeId,
      signature
    })
  });

  if (verified.state !== 'WALLET_VERIFIED') {
    throw new Error('WALLET_VERIFICATION_FAILED');
  }

  return walletAddress;
}

export async function createSignedMarketplaceRequest({
  listingId,
  quantity = 1,
  note = '',
  onChallenge
}) {
  const walletAddress = await ensureVerifiedMarketplaceWallet();

  const challenge = await requestJson(
    '/api/marketplace/orders/challenge',
    {
      method: 'POST',
      body: JSON.stringify({ listingId, quantity })
    }
  );

  if (typeof onChallenge === 'function') {
    await onChallenge(challenge);
  }

  const signature = await signMessage(
    challenge.message,
    walletAddress
  );

  return requestJson('/api/marketplace/orders', {
    method: 'POST',
    body: JSON.stringify({
      listingId,
      quantity,
      note,
      challengeId: challenge.challengeId,
      signature
    })
  });
}

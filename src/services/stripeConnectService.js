const https = require('https');

function assertStripeTestMode() {
  const key = String(process.env.STRIPE_SECRET_KEY || '');
  if (!key.startsWith('sk_test_')) {
    const error = new Error('Stripe Connect onboarding is test-mode only until live rollout is explicitly approved');
    error.code = 'STRIPE_CONNECT_TEST_MODE_REQUIRED';
    throw error;
  }
}

function stripeRequest(method, path, params) {
  assertStripeTestMode();
  return new Promise((resolve, reject) => {
    const body = params ? new URLSearchParams(params).toString() : '';
    const request = https.request({
      hostname:'api.stripe.com', port:443, path, method,
      headers:{
        Authorization:`Bearer ${process.env.STRIPE_SECRET_KEY}`,
        ...(body ? { 'Content-Type':'application/x-www-form-urlencoded', 'Content-Length':Buffer.byteLength(body) } : {})
      }
    }, response => {
      let data='';
      response.setEncoding('utf8');
      response.on('data', chunk => { data += chunk; });
      response.on('end', () => {
        let parsed;
        try { parsed = data ? JSON.parse(data) : {}; }
        catch (_error) { return reject(new Error('Risposta Stripe Connect non valida')); }
        if (response.statusCode < 200 || response.statusCode >= 300) {
          const error = new Error(parsed?.error?.message || `Stripe HTTP ${response.statusCode}`);
          error.statusCode = response.statusCode;
          error.stripeCode = parsed?.error?.code;
          return reject(error);
        }
        resolve(parsed);
      });
    });
    request.on('error', reject);
    if (body) request.write(body);
    request.end();
  });
}

async function createConnectAccount(userId) {
  return stripeRequest('POST', '/v1/accounts', {
    type:'express',
    country:process.env.STRIPE_CONNECT_COUNTRY || 'IT',
    'capabilities[card_payments][requested]':'true',
    'capabilities[transfers][requested]':'true',
    'metadata[myzubsterUserId]':String(userId)
  });
}

async function retrieveConnectAccount(accountId) {
  return stripeRequest('GET', `/v1/accounts/${encodeURIComponent(accountId)}`);
}

async function createAccountLink(accountId) {
  const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL;
  const returnUrl = process.env.STRIPE_CONNECT_RETURN_URL;
  if (!refreshUrl || !returnUrl) throw new Error('STRIPE_CONNECT_REFRESH_URL e STRIPE_CONNECT_RETURN_URL obbligatori');
  return stripeRequest('POST', '/v1/account_links', {
    account:accountId,
    refresh_url:refreshUrl,
    return_url:returnUrl,
    type:'account_onboarding'
  });
}

function connectState(account) {
  return {
    stripeConnectDetailsSubmitted:Boolean(account?.details_submitted),
    stripeConnectChargesEnabled:Boolean(account?.charges_enabled),
    stripeConnectPayoutsEnabled:Boolean(account?.payouts_enabled)
  };
}

module.exports = { assertStripeTestMode, createConnectAccount, retrieveConnectAccount, createAccountLink, connectState };

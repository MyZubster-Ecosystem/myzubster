'use strict';

const fs = require('fs');
const path = require('path');

describe('Marketplace seller checkout UI', () => {
  const page = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/MarketplacePage.js'), 'utf8');

  test('sends the MyZubster bearer token to seller checkout', () => {
    expect(page).toContain("localStorage.getItem('myzubster-token')");
    expect(page).toContain('Authorization: `Bearer ${token}`');
    expect(page).toContain("apiAction('/api/marketplace/seller/checkout', {})");
  });

  test('redirects unauthenticated or expired sessions to login and returns to marketplace', () => {
    expect(page).toContain("window.location.assign(`/social-login?returnTo=${encodeURIComponent(returnTo)}`)");
    expect(page).toContain('if (e.status === 401)');
    expect(page).toContain("localStorage.removeItem('myzubster-token')");
  });

  test('opens Stripe Checkout when the backend returns a checkout URL', () => {
    expect(page).toContain('window.location.assign(payload.checkoutUrl)');
  });
});

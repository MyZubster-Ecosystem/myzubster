'use strict';

const fs = require('fs');
const path = require('path');

describe('Marketplace seller checkout UI', () => {
  const page = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/MarketplacePage.js'), 'utf8');

  test('sends the MyZubster bearer token to seller checkout', () => {
    expect(page).toContain("localStorage.getItem('myzubster-token')");
    expect(page).toContain('Authorization: `Bearer ${token}`');
    expect(page).toContain("apiAction('/api/marketplace/seller/checkout',{})");
  });

  test('redirects unauthenticated or expired sessions to login and returns to marketplace', () => {
    expect(page).toContain("window.location.assign(`/social-login?returnTo=${encodeURIComponent(returnTo)}`)");
    expect(page).toContain('if (e.status === 401)');
    expect(page).toContain("localStorage.removeItem('myzubster-token')");
  });

  test('opens Stripe Checkout when the backend returns a checkout URL', () => {
    expect(page).toContain('window.location.assign(payload.checkoutUrl)');
  });

  test('presents the founding Seller trial with transparent renewal terms', () => {
    expect(page).toContain("activateTrial:'Inizia {days} giorni gratis'");
    expect(page).toContain("trialTerms:'Per i nuovi Seller idonei: nessun addebito per {days} giorni, poi 9,90 €/mese.");
    expect(page).toContain("cohort:'Cohort Founding Seller'");
  });

  test('shows clearly labelled demo sellers without creating fake accounts or payments', () => {
    expect(page).toContain("const DEMO_SELLERS=[");
    expect(page).toContain("demoNote:'Profili dimostrativi: non sono persone reali e non accettano ordini o pagamenti.'");
    expect(page).toContain("id:'demo-kefir'");
    expect(page).toContain("id:'demo-repair'");
    expect(page).toContain("id:'demo-seeds'");
    expect(page).toContain("id:'demo-sound-system'");
    expect(page).toContain("Vendita o noleggio di un sound system artigianale completo");
    expect(page).toContain("id:'demo-audio-gear'");
    expect(page).toContain("id:'demo-event-tech'");
    expect(page.indexOf('DEMO_SELLERS.map')).toBeLessThan(page.indexOf('listings.map'));
  });

  test('keeps wallet details outside the primary conversion path', () => {
    expect(page.indexOf('<WalletHubPanel compact/>')).toBeGreaterThan(page.indexOf('listings.map'));
  });
});

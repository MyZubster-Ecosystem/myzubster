'use strict';

const fs = require('fs');
const path = require('path');

describe('Marketplace free-first Seller UI', () => {
  const page = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/MarketplacePage.js'), 'utf8');

  test('sends the MyZubster bearer token to free Seller activation', () => {
    expect(page).toContain("localStorage.getItem('myzubster-token')");
    expect(page).toContain('Authorization: `Bearer ${token}`');
    expect(page).toContain("apiAction('/api/marketplace/seller/subscribe',{})");
    expect(page).not.toContain("apiAction('/api/marketplace/seller/checkout',{})");
  });

  test('redirects unauthenticated or expired sessions to login and returns to marketplace', () => {
    expect(page).toContain("window.location.assign(`/social-login?returnTo=${encodeURIComponent(returnTo)}`)");
    expect(page).toContain('if(e.status===401)');
    expect(page).toContain("localStorage.removeItem('myzubster-token')");
  });

  test('does not redirect initial Seller activation to Stripe Checkout', () => {
    expect(page).not.toContain('window.location.assign(payload.checkoutUrl)');
    expect(page).toContain("activate:'Diventa Seller gratis'");
    expect(page).toContain("activating:'Attivazione gratuita del profilo Seller…'");
  });

  test('explains earnings-first monetization and the 2 percent commission', () => {
    expect(page).toContain('Pubblica gratis. L’onboarding dei pagamenti parte solo al primo incasso reale');
    expect(page).toContain('Commissione MyZubster sulle transazioni pagate idonee: 2%');
    expect(page).toContain('Seller attivato gratis. Pubblica ora; configuri i pagamenti solo quando inizi a guadagnare.');
    expect(page).not.toContain('30 giorni gratis');
    expect(page).not.toContain('9,90 €/mese');
  });

  test('shows clearly labelled demo sellers without creating fake accounts or payments', () => {
    expect(page).toContain("const DEMO_SELLERS=[");
    expect(page).toContain("demoNote:'Profili dimostrativi interattivi. Gli annunci demo sono contenuti di esempio e non creano transazioni reali.'");
    expect(page).toContain("id:'demo-kefir'");
    expect(page).toContain("id:'demo-repair'");
    expect(page).toContain("id:'demo-seeds'");
    expect(page).toContain("id:'demo-sound-system'");
    expect(page).toContain("Vendita o noleggio di un sound system artigianale completo");
    expect(page).toContain("id:'demo-audio-gear'");
    expect(page).toContain("id:'demo-event-tech'");
    expect(page).toContain("id:'demo-subculture-wear'");
    expect(page).toContain("Indumenti, patch, borse e accessori legati alle culture underground");
    expect(page).toContain("id:'demo-event-sound-rental'");
    expect(page).toContain("id:'demo-dj-package'");
    expect(page).toContain("id:'demo-event-machines'");
    expect(page).toContain("'clothing','accessories','event_equipment'");
    expect(page.indexOf('filteredDemos.map')).toBeLessThan(page.indexOf('listings.map'));
  });

  test('maps every event demo popup to an uploaded visual', () => {
    expect(page).toContain("'demo-event-tech':'/images/marketplace/demo/sound-system-collective.jpg'");
    expect(page).toContain("'demo-subculture-wear':'/images/marketplace/demo/upcycled-accessories.jpg'");
    expect(page).toContain("'demo-event-sound-rental':'/images/marketplace/demo/sound-system-collective.jpg'");
    expect(page).toContain("'demo-dj-package':'/images/marketplace/demo/dj-crew.jpg'");
    expect(page).toContain("'demo-event-machines':'/images/marketplace/demo/underground-audio-gear.jpg'");
    expect(page).toContain('!DEMO_IMAGES[selectedDemo.id]');
  });

  test('keeps wallet details outside the primary conversion path', () => {
    expect(page.indexOf('<WalletHubPanel compact/>')).toBeGreaterThan(page.indexOf('listings.map'));
  });
});

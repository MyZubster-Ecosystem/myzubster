const fs = require('fs');
const path = require('path');

describe('Zorgax Marketplace listing assistant', () => {
  const page = fs.readFileSync(path.join(__dirname, '../public/community-marketplace.html'), 'utf8');
  const assistant = fs.readFileSync(path.join(__dirname, '../public/zorgax-listing-assistant.js'), 'utf8');

  test('is loaded by the real community marketplace form', () => {
    expect(page).toContain('id="listingForm"');
    expect(page).toContain('<script src="/zorgax-listing-assistant.js"></script>');
  });

  test('never auto-publishes and only pre-fills existing fields', () => {
    expect(assistant).toContain('Precompila annuncio');
    expect(assistant).toContain('nulla viene pubblicato senza il tuo click');
    expect(assistant).not.toContain("fetch('/api/listings/create'");
    expect(assistant).not.toContain('form.submit()');
  });

  test('tracks only privacy-safe funnel step names', () => {
    expect(assistant).toContain('marketplace_listing_assistant_open');
    expect(assistant).toContain('marketplace_listing_assistant_fields_completed');
    expect(assistant).toContain('marketplace_listing_submit');
    expect(assistant).toContain("target: String(target || '').slice(0, 80)");
  });
});

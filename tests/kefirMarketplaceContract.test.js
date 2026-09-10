const fs = require('fs');
const path = require('path');

describe('community marketplace kefir donor contract', () => {
  const page = fs.readFileSync(path.join(__dirname, '../public/community-marketplace.html'), 'utf8');
  const routes = fs.readFileSync(path.join(__dirname, '../src/routes/listingRoutes.js'), 'utf8');

  test('offers a dedicated kefir donor category and filter', () => {
    expect(page).toContain('value="kefir_culture_donation"');
    expect(page).toContain('data-filter="kefir_culture_donation"');
  });

  test('forces kefir cultures to remain free donations', () => {
    expect(routes).toContain("category === 'kefir_culture_donation' && normalizedCurrency !== 'FREE'");
    expect(routes).toContain('dono gratuito');
  });

  test('requires type and safety acknowledgement', () => {
    expect(routes).toContain("['milk','water'].includes(kefir?.type)");
    expect(routes).toContain("kefir?.safetyAcknowledged !== true");
  });

  test('keeps the donor path outside paid seller membership', () => {
    expect(routes).toContain("const donationOnly = requestedCategory === 'kefir_culture_donation'");
    expect(routes).toContain('const membership = donationOnly ? true : await activeSeller');
  });
});

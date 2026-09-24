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
    expect(routes).toContain("category==='kefir_culture_donation'&&!['FREE','BARTER'].includes(normalizedCurrency)");
    expect(routes).toContain('dono gratuito o baratto non commerciale');
  });

  test('requires type and safety acknowledgement', () => {
    expect(routes).toContain("!['milk','water'].includes(kefir?.type)");
    expect(routes).toContain("kefir?.safetyAcknowledged!==true");
  });

  test('keeps the donor path outside paid seller membership', () => {
    expect(routes).toContain("isCommunityExchange(category, currency)");
    expect(routes).toContain("category==='kefir_culture_donation'");
  });
});

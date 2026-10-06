const fs = require('fs');
const path = require('path');

describe('community marketplace kefir donor contract', () => {
  const page = fs.readFileSync(path.join(__dirname, '../public/community-marketplace.html'), 'utf8');
  const routes = fs.readFileSync(path.join(__dirname, '../src/routes/listingRoutes.js'), 'utf8');

  test('offers a dedicated kefir donor category and filter', () => {
    expect(page).toContain('value="kefir_culture_donation"');
    expect(page).toContain('data-filter="kefir_culture_donation"');
  });

  test('limits kefir cultures to gifts or noncommercial barter', () => {
    expect(routes).toContain("category==='kefir_culture_donation'&&!['FREE','BARTER'].includes(normalizedCurrency)");
    expect(routes).toContain('dono gratuito');
  });

  test('requires type and safety acknowledgement', () => {
    expect(routes).toContain("['milk','water'].includes(kefir?.type)");
    expect(routes).toContain("kefir?.safetyAcknowledged!==true");
  });

  test('keeps the donor path outside paid seller membership', () => {
    expect(routes).toContain('const communityExchange=isCommunityExchange(requestedCategory,requestedCurrency)');
    expect(routes).toContain('communityExchange?await MarketplaceListing.create(listingData):await createCommercialListingTransaction');
  });
});

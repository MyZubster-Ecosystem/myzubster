const fs = require('fs');
const path = require('path');

describe('Zorgax Stripe card checkout wiring', () => {
  const root = path.resolve(__dirname, '..');
  const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
  const ui = fs.readFileSync(path.join(root, 'public', 'zorgax-card.js'), 'utf8');
  const route = fs.readFileSync(path.join(root, 'src', 'routes', 'zorgaxStripeRoutes.js'), 'utf8');
  const seller = fs.readFileSync(path.join(root, 'src', 'routes', 'sellerRoutes.js'), 'utf8');
  const subscription = fs.readFileSync(path.join(root, 'src', 'models', 'ZorgaxSubscription.js'), 'utf8');

  test('mounts a dedicated authenticated Zorgax Stripe checkout', () => {
    expect(server).toContain("app.use('/api/zorgax/stripe',zorgaxStripeRoutes)");
    expect(route).toContain("router.post('/checkout', authenticate");
    expect(route).toContain('createStripeCheckout');
  });

  test('adds card payment next to the existing BTC upgrade path', () => {
    expect(ui).toContain("cardButton.id = 'startCard'");
    expect(ui).toContain("Paga con carta");
    expect(ui).toContain("/api/zorgax/stripe/checkout");
    expect(ui).toContain("window.location.assign(data.checkoutUrl)");
  });

  test('keeps Zorgax and Seller Stripe subscriptions separated', () => {
    expect(seller).toContain("object.metadata?.product==='zorgax'");
    expect(seller).toContain('activateZorgaxInvoice(object)');
    expect(subscription).toContain("'STRIPE'");
  });
});

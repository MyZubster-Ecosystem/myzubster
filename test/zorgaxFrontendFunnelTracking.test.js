'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax frontend funnel tracking', () => {
  const page = fs.readFileSync(path.join(__dirname, '../public/zorgax.html'), 'utf8');

  test('tracks Zorgax page open through the privacy-safe funnel endpoint', () => {
    expect(page).toContain("fetch('/api/zorgax/assistant/track'");
    expect(page).toContain("trackFunnel('zorgax_open')");
  });

  test('wires navigation CTAs to the accepted funnel events', () => {
    expect(page).toContain('data-funnel-event="zorgax_to_marketplace"');
    expect(page).toContain('data-funnel-event="zorgax_to_seller"');
    expect(page).toContain('data-funnel-event="zorgax_to_metaverse"');
    expect(page).toContain('data-funnel-event="zorgax_to_life"');
  });

  test('uses existing production destinations for the CTAs', () => {
    expect(page).toContain('href="/marketplace"');
    expect(page).toContain('href="/metaverse"');
    expect(page).toContain('href="/life-pilot"');
  });

  test('fires tracking without blocking navigation', () => {
    expect(page).toContain('keepalive:true');
    expect(page).toContain("document.querySelectorAll('[data-funnel-event]')");
  });
});

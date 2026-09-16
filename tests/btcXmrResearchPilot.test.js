const fs = require('fs');
const path = require('path');

describe('BTC/XMR research pilot', () => {
  const page = fs.readFileSync(path.join(__dirname, '../public/btc-xmr-research-pilot.html'), 'utf8');
  const vercel = fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8');

  test('is explicitly a simulation and never requests wallet secrets', () => {
    expect(page).toContain('no real funds are moved');
    expect(page).toContain('never asks for seed phrases or private keys');
    expect(page).toContain('does not broadcast BTC or XMR transactions');
  });

  test('tracks only research funnel steps and rail selection', () => {
    expect(page).toContain('btc_xmr_research_pilot_started');
    expect(page).toContain('btc_xmr_research_pilot_completed');
    expect(page).toContain('No wallet address, transaction hash or free-text payment data is sent');
  });

  test('is exposed as a Vercel static route', () => {
    expect(vercel).toContain('public/btc-xmr-research-pilot.html');
    expect(vercel).toContain('/btc-xmr-research-pilot');
  });
});

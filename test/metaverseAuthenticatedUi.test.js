const fs = require('fs');
const path = require('path');

describe('authenticated metaverse UI wiring', () => {
  const apiSource = fs.readFileSync(path.join(__dirname, '../frontend/src/api/metaverse.js'), 'utf8');
  const pageSource = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/MetaversePage.js'), 'utf8');

  test('sends the MyZubster bearer token only when it exists', () => {
    expect(apiSource).toContain("localStorage.getItem('myzubster-token')");
    expect(apiSource).toContain('Authorization: `Bearer ${token}`');
    expect(apiSource).toContain('headers: authHeaders()');
  });

  test('replaces a stale guest profile with the canonical server character', () => {
    expect(pageSource).toContain('displayName: result.player.displayName');
    expect(pageSource).toContain('characterName: result.player.characterName');
    expect(pageSource).toContain('identityStatus: result.player.identityStatus');
    expect(pageSource).toContain("localStorage.setItem(STORAGE_KEY, JSON.stringify(joinedProfile))");
  });

  test('renders account-linked characters as verified instead of guests', () => {
    expect(pageSource).toContain("identityStatus === 'account-linked'");
    expect(pageSource).toContain("isAccountLinked(me?.identityStatus) ? 'MYZ VERIFIED' : 'Ospite'");
    expect(pageSource).toContain('@{me.github.login} ↗');
  });

  test('uses resilient shared-state sync instead of a serverless EventSource', () => {
    expect(apiSource).toContain("jsonRequest('/api/metaverse/sync'");
    expect(pageSource).toContain('syncMetaverse(sessionId, cursor)');
    expect(pageSource).toContain("setStatus('online')");
    expect(pageSource).toContain("setStatus('reconnecting')");
    expect(pageSource).not.toContain('createMetaverseEventSource');
    expect(apiSource).not.toContain('new EventSource');
  });

  test('uses a named polling interval for predictable realtime timing', () => {
    expect(pageSource).toContain('const SYNC_INTERVAL_MS = 1800');
    expect(pageSource).toContain('schedule(SYNC_INTERVAL_MS)');
  });
});

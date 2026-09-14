const fs = require('fs');
const path = require('path');

describe('authenticated metaverse UI wiring', () => {
  const apiSource = fs.readFileSync(path.join(__dirname, '../frontend/src/api/metaverse.js'), 'utf8');
  const pageSource = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/MetaversePage.js'), 'utf8');
  const roomPageSource = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/MetaverseRoomPage.js'), 'utf8');
  const roomCreateSource = fs.readFileSync(path.join(__dirname, '../frontend/src/pages/MetaverseRoomCreatePage.js'), 'utf8');

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

  test('clears an expired authenticated session and presents a fresh login path', () => {
    expect(pageSource).toContain('if (profileError.status === 401)');
    expect(pageSource).toContain("localStorage.removeItem('myzubster-token')");
    expect(pageSource).toContain('setAuthenticated(false)');
    expect(pageSource).toContain('Sessione scaduta. Accedi di nuovo');
  });

  test('renders account-linked characters as verified instead of guests', () => {
    expect(pageSource).toContain("identityStatus === 'account-linked'");
    expect(pageSource).toContain("isAccountLinked(me?.identityStatus) ? 'MYZ VERIFIED' : 'Ospite'");
    expect(pageSource).toContain('@{me.github.login} ↗');
  });

  test('creates rooms as drafts and advances lifecycle through server APIs', () => {
    expect(roomCreateSource).toContain('Crea bozza');
    expect(roomCreateSource).toContain('createMetaverseRoom');
    expect(roomPageSource).toContain("{ state: 'published' }");
    expect(roomPageSource).toContain('createMetaverseRoomSession');
    expect(roomPageSource).toContain('startMetaverseRoomSession');
  });

  test('keeps the room view honest about authorization and realtime readiness', () => {
    expect(roomPageSource).toContain("session.state !== 'live'");
    expect(roomPageSource).toContain('Richiedi accesso alla sessione');
    expect(roomPageSource).toContain('Il client realtime della stanza è ancora sperimentale');
    expect(roomPageSource).not.toContain('realtimeToken');
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

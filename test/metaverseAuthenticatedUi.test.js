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
    expect(roomPageSource).toContain('leaveMetaverseRoomSession');
    expect(roomPageSource).toContain('endMetaverseRoomSession');
    expect(roomPageSource).toContain('Lascia sessione');
    expect(roomPageSource).toContain('Concludi sessione');
    expect(roomPageSource).toContain('Annulla sessione programmata');
    expect(roomPageSource).toContain('cancelMetaverseRoomSession');
    expect(roomPageSource).toContain('Moderazione partecipanti');
    expect(roomPageSource).toContain('Richiedi di parlare');
    expect(roomPageSource).toContain('Richieste approvate dall’host');
    expect(roomPageSource).toContain('stagePolicy: editStagePolicy');
    expect(roomPageSource).toContain('Data e ora della sessione');
    expect(roomPageSource).toContain('scheduledFor: editScheduledFor');
    expect(roomPageSource).toContain('toLocalDateTimeInput');
    expect(roomPageSource).toContain('Richieste di parola');
    expect(roomPageSource).toContain('Annulla richiesta');
    expect(roomPageSource).toContain('Lascia palco');
    expect(roomPageSource).toContain('Partecipanti sul palco');
    expect(roomPageSource).toContain('Revoca palco');
    expect(roomPageSource).toContain('requestMetaverseStageAccess');
    expect(roomPageSource).toContain('resolveMetaverseStageRequest');
    expect(roomPageSource).toContain('Rimuovi e blocca');
    expect(roomPageSource).toContain('Account bloccati');
    expect(roomPageSource).toContain('Ripristina accesso');
    expect(roomPageSource).toContain('getMetaverseRoomBlocklist');
    expect(roomPageSource).toContain('unblockMetaverseRoomParticipant');
    expect(roomPageSource).toContain('getMetaverseRoomParticipants');
    expect(roomPageSource).toContain('moderateMetaverseRoomParticipant');
    expect(roomPageSource).toContain('Salva impostazioni');
    expect(roomPageSource).toContain('Crea invito privato');
    expect(roomPageSource).toContain('Revoca invito');
    expect(roomPageSource).toContain('getMetaverseRoomInviteStatus');
    expect(roomPageSource).toContain('revokeMetaverseRoomInvite');
    expect(apiSource).toContain("method: 'DELETE'");
    expect(roomPageSource).toContain('redeemMetaverseRoomInvite');
    expect(roomPageSource).toContain("new URLSearchParams(window.location.search).get('invite')");
    expect(apiSource).toContain('/invitations/redeem');
    expect(roomPageSource).toContain('Accedi per riscattare l’invito privato');
    expect(roomPageSource).toContain('window.location.search');
    expect(roomPageSource).toContain("['draft', 'published'].includes(room.state)");
    expect(roomPageSource).toContain('setJoined(Boolean(result.joined))');
    expect(roomPageSource).toContain('getMetaverseRoomSessionEvents');
    expect(roomPageSource).toContain('const ROOM_SYNC_INTERVAL_MS = 5000');
    expect(roomPageSource).toContain('window.setInterval(refresh, ROOM_SYNC_INTERVAL_MS)');
    expect(roomPageSource).toContain("ended: 'Conclusa'");
    expect(roomPageSource).toContain('Cronologia della sessione');
    expect(roomPageSource).toContain('Chat della stanza');
    expect(roomPageSource).toContain('getMetaverseRoomMessages');
    expect(roomPageSource).toContain('sendMetaverseRoomMessage');
    expect(roomPageSource).toContain('I messaggi scadono automaticamente dopo 24 ore.');
    expect(roomPageSource).toContain('nessun ID partecipante viene mostrato');
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

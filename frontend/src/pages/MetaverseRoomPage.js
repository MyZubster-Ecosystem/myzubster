import React, { useEffect, useState } from 'react';
import {
  createMetaverseRoomInvite,
  createMetaverseRoomSession,
  endMetaverseRoomSession,
  getMetaverseRoom,
  getMetaverseRoomInviteStatus,
  getMetaverseRoomSessionEvents,
  joinMetaverseRoomSession,
  leaveMetaverseRoomSession,
  redeemMetaverseRoomInvite,
  revokeMetaverseRoomInvite,
  startMetaverseRoomSession,
  updateMetaverseRoom
} from '../api/metaverse';
import './MetaversePage.css';

function stateLabel(state) {
  return {
    published: 'Pubblicata',
    scheduled: 'Programmato',
    live: 'Live'
  }[state] || state;
}

function MetaverseRoomPage({ roomKey }) {
  const authenticated = Boolean(localStorage.getItem('myzubster-token'));
  const [room, setRoom] = useState(null);
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [joining, setJoining] = useState(false);
  const [canManage, setCanManage] = useState(false);
  const [joined, setJoined] = useState(false);
  const [events, setEvents] = useState([]);
  const [editAccess, setEditAccess] = useState('authenticated');
  const [editCapacity, setEditCapacity] = useState(25);
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteStatus, setInviteStatus] = useState({ active: false, expiresAt: null });

  useEffect(() => {
    let active = true;
    const loadRoom = async () => {
      const inviteCode = new URLSearchParams(window.location.search).get('invite');
      if (inviteCode && authenticated) {
        await redeemMetaverseRoomInvite(roomKey, inviteCode);
        window.history.replaceState({}, '', window.location.pathname);
      }
      return getMetaverseRoom(roomKey);
    };
    loadRoom()
      .then((result) => {
        if (!active) return;
        setRoom(result.room);
        setSession(result.session);
        setCanManage(Boolean(result.canManage));
        setJoined(Boolean(result.joined));
        setEditAccess(result.room.accessPolicy);
        setEditCapacity(result.room.capacity);
        setStatus('ready');
        if (result.canManage && result.room.accessPolicy === 'private') {
          getMetaverseRoomInviteStatus(result.room.slug || result.room.id)
            .then((statusResult) => {
              if (active) setInviteStatus(statusResult.invitation);
            })
            .catch(() => {});
        }
      })
      .catch((error) => {
        if (!active) return;
        setMessage(error.status === 404 ? 'Stanza non trovata o non accessibile.' : error.message);
        setStatus('error');
      });
    return () => { active = false; };
  }, [roomKey]);

  useEffect(() => {
    if (!session?.id) {
      setEvents([]);
      return undefined;
    }

    let active = true;
    let cursor = 0;
    let timer = null;

    const loadEvents = async () => {
      try {
        const result = await getMetaverseRoomSessionEvents(session.id, cursor);
        if (!active) return;
        cursor = result.cursor || cursor;
        if (Array.isArray(result.events) && result.events.length > 0) {
          setEvents((current) => {
            const merged = new Map(current.map((event) => [event.id, event]));
            result.events.forEach((event) => merged.set(event.id, event));
            return Array.from(merged.values()).sort((left, right) => left.sequence - right.sequence);
          });
        }
      } catch (_error) {
        if (!active) return;
      }
      if (active) timer = window.setTimeout(loadEvents, 5000);
    };

    loadEvents();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [session?.id]);

  const join = async () => {
    if (!session?.id || session.state !== 'live') return;
    setJoining(true);
    setMessage('');
    try {
      const result = await joinMetaverseRoomSession(session.id);
      setSession(result.session);
      setJoined(true);
      setMessage('Accesso autorizzato. Il client realtime della stanza è ancora sperimentale e non viene avviato da questa pagina.');
    } catch (error) {
      setMessage(error.status === 401 ? 'Accedi nuovamente per entrare nella stanza.' : error.message);
    } finally {
      setJoining(false);
    }
  };

  const leave = async () => {
    if (!session?.id || !joined) return;
    setJoining(true);
    setMessage('');
    try {
      const result = await leaveMetaverseRoomSession(session.id);
      setSession(result.session);
      setJoined(false);
      setMessage('Hai lasciato la sessione.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setJoining(false);
    }
  };

  const end = async () => {
    if (!session?.id || !canManage || session.state !== 'live') return;
    setJoining(true);
    setMessage('');
    try {
      const result = await endMetaverseRoomSession(session.id);
      setSession(result.session);
      setRoom((current) => ({ ...current, state: 'ended' }));
      setJoined(false);
      setMessage('Sessione conclusa dall’host.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setJoining(false);
    }
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setJoining(true);
    setMessage('');
    try {
      const result = await updateMetaverseRoom(room.slug || room.id, {
        accessPolicy: editAccess,
        capacity: Number(editCapacity)
      });
      setRoom(result.room);
      setMessage('Impostazioni della stanza salvate.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setJoining(false);
    }
  };

  const createInvite = async () => {
    if (!canManage || room.accessPolicy !== 'private') return;
    setJoining(true);
    setMessage('');
    try {
      const result = await createMetaverseRoomInvite(room.slug || room.id);
      const url = new URL(window.location.href);
      url.search = '';
      url.searchParams.set('invite', result.inviteCode);
      setInviteUrl(url.toString());
      setInviteStatus({ active: true, expiresAt: result.expiresAt });
      setMessage('Invito creato. Scade tra 24 ore e può essere usato una sola volta.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setJoining(false);
    }
  };

  const revokeInvite = async () => {
    if (!canManage) return;
    setJoining(true);
    setMessage('');
    try {
      const result = await revokeMetaverseRoomInvite(room.slug || room.id);
      setInviteStatus(result.invitation);
      setInviteUrl('');
      setMessage('Invito privato revocato.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setJoining(false);
    }
  };

  const manageLifecycle = async () => {
    setJoining(true);
    setMessage('');
    try {
      if (room.state === 'draft') {
        const result = await updateMetaverseRoom(room.slug || room.id, { state: 'published' });
        setRoom(result.room);
        setMessage('Stanza pubblicata. Ora puoi creare una sessione.');
      } else if (room.state === 'published' && !session) {
        const result = await createMetaverseRoomSession(room.id);
        setSession(result.session);
        setRoom((current) => ({ ...current, state: 'scheduled' }));
        setMessage('Sessione creata e programmata.');
      } else if (session?.state === 'scheduled') {
        const result = await startMetaverseRoomSession(session.id);
        setSession(result.session);
        setRoom((current) => ({ ...current, state: 'live' }));
        setMessage('Sessione avviata.');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setJoining(false);
    }
  };

  if (status === 'loading') {
    return <main className="metaverse-entry-shell"><section className="metaverse-entry-card"><p>Caricamento stanza…</p></section></main>;
  }

  if (status === 'error' || !room) {
    const pendingInvite = new URLSearchParams(window.location.search).has('invite');
    const returnTo = encodeURIComponent(`${window.location.pathname}${window.location.search}`);
    return (
      <main className="metaverse-entry-shell">
        <section className="metaverse-entry-card">
          <h2>Stanza non disponibile</h2>
          <p>{message}</p>
          {pendingInvite && !authenticated && <p><a href={`/social-login?returnTo=${returnTo}`}>Accedi per riscattare l’invito privato</a></p>}
          <a href="/metaverse">← Torna a Neon Plaza</a>
        </section>
      </main>
    );
  }

  const live = session?.state === 'live';

  return (
    <main className="metaverse-entry-shell">
      <section className="metaverse-entry-card">
        <div className="metaverse-kicker">MYZUBSTER WORLD · STANZA SPERIMENTALE</div>
        <h2>{room.name}</h2>
        <p><strong>Stato:</strong> {stateLabel(room.state)}</p>
        <p><strong>Accesso:</strong> {room.accessPolicy}</p>
        <p><strong>Capacità:</strong> {room.capacity}</p>
        <p><strong>Versione scena:</strong> {room.sceneManifestVersion}</p>
        {canManage && (
          <div className="metaverse-panel">
            <h3>Controlli host</h3>
            <p className="metaverse-muted">Le transizioni sono validate dal server e non possono tornare indietro.</p>
            {['draft', 'published'].includes(room.state) && !session && (
              <form className="metaverse-form" onSubmit={saveSettings}>
                <label>Accesso<select value={editAccess} onChange={(event) => setEditAccess(event.target.value)}><option value="public">Pubblico</option><option value="authenticated">Solo account</option><option value="private">Privato</option></select></label>
                <label>Capacità<input type="number" min="1" max="500" value={editCapacity} onChange={(event) => setEditCapacity(event.target.value)} /></label>
                <button type="submit" disabled={joining}>Salva impostazioni</button>
              </form>
            )}
            {room.accessPolicy === 'private' && !['ended', 'archive'].includes(room.state) && (
              <div className="metaverse-panel">
                <button type="button" onClick={createInvite} disabled={joining}>Crea invito privato</button>
                {inviteUrl && <label>Link monouso<input value={inviteUrl} readOnly onFocus={(event) => event.target.select()} /></label>}
                {inviteStatus.active && (
                  <p className="metaverse-muted">Invito attivo fino al {new Date(inviteStatus.expiresAt).toLocaleString('it-IT')}.</p>
                )}
                {inviteStatus.active && <button type="button" onClick={revokeInvite} disabled={joining}>Revoca invito</button>}
                <small className="metaverse-muted">La creazione di un nuovo invito disattiva quello precedente.</small>
              </div>
            )}
            {room.state === 'draft' && <button className="metaverse-primary" onClick={manageLifecycle} disabled={joining}>Pubblica stanza</button>}
            {room.state === 'published' && !session && <button className="metaverse-primary" onClick={manageLifecycle} disabled={joining}>Crea sessione</button>}
            {session?.state === 'scheduled' && <button className="metaverse-primary" onClick={manageLifecycle} disabled={joining}>Avvia sessione</button>}
          </div>
        )}
        {session ? (
          <div className="metaverse-panel">
            <h3>Sessione {stateLabel(session.state)}</h3>
            <p>{session.participantCount} partecipanti su {session.capacity}</p>
            {live && authenticated && !joined && (
              <button className="metaverse-primary" onClick={join} disabled={joining}>
                {joining ? 'Accesso…' : 'Richiedi accesso alla sessione'}
              </button>
            )}
            {live && joined && <button onClick={leave} disabled={joining}>Lascia sessione</button>}
            {live && canManage && <button onClick={end} disabled={joining}>Concludi sessione</button>}
            {live && !authenticated && <p><a href="/social-login?returnTo=%2Fmetaverse">Accedi per entrare nella sessione.</a></p>}
            {!live && <p className="metaverse-muted">La sessione non è ancora live.</p>}
          </div>
        ) : (
          <p className="metaverse-muted">Nessuna sessione programmata o live.</p>
        )}
        {session && (
          <section className="metaverse-panel">
            <h3>Cronologia della sessione</h3>
            {events.length === 0 ? (
              <p className="metaverse-muted">Nessun evento disponibile.</p>
            ) : (
              <ol className="metaverse-check-list">
                {events.map((event) => (
                  <li key={event.id}>
                    <span>{event.type === 'session_started' ? '▶️' : event.type === 'session_ended' ? '⏹️' : event.type === 'participant_joined' ? '➕' : event.type === 'participant_left' ? '➖' : '🗂️'}</span>
                    <span>{event.type.replaceAll('_', ' ')} · {event.participantCount} partecipanti</span>
                  </li>
                ))}
              </ol>
            )}
            <small className="metaverse-muted">Eventi tecnici conservati per sette giorni; nessun ID partecipante viene mostrato.</small>
          </section>
        )}
        {message && <div className="metaverse-error" aria-live="polite">{message}</div>}
        <p><a href="/metaverse">← Torna a Neon Plaza</a></p>
        <small className="metaverse-muted">Questa pagina verifica accesso e ciclo di vita sul server. Rendering realtime e scena immersiva non sono ancora collegati.</small>
      </section>
    </main>
  );
}

export { stateLabel };
export default MetaverseRoomPage;

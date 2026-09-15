import React, { useEffect, useState } from 'react';
import {
  createMetaverseRoomSession,
  endMetaverseRoomSession,
  getMetaverseRoom,
  getMetaverseRoomSessionEvents,
  joinMetaverseRoomSession,
  leaveMetaverseRoomSession,
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

  useEffect(() => {
    let active = true;
    getMetaverseRoom(roomKey)
      .then((result) => {
        if (!active) return;
        setRoom(result.room);
        setSession(result.session);
        setCanManage(Boolean(result.canManage));
        setJoined(Boolean(result.joined));
        setStatus('ready');
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
    return <main className="metaverse-entry-shell"><section className="metaverse-entry-card"><h2>Stanza non disponibile</h2><p>{message}</p><a href="/metaverse">← Torna a Neon Plaza</a></section></main>;
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

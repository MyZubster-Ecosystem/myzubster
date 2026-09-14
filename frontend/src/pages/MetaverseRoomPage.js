import React, { useEffect, useState } from 'react';
import { getMetaverseRoom, joinMetaverseRoomSession } from '../api/metaverse';
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

  useEffect(() => {
    let active = true;
    getMetaverseRoom(roomKey)
      .then((result) => {
        if (!active) return;
        setRoom(result.room);
        setSession(result.session);
        setStatus('ready');
      })
      .catch((error) => {
        if (!active) return;
        setMessage(error.status === 404 ? 'Stanza non trovata o non accessibile.' : error.message);
        setStatus('error');
      });
    return () => { active = false; };
  }, [roomKey]);

  const join = async () => {
    if (!session?.id || session.state !== 'live') return;
    setJoining(true);
    setMessage('');
    try {
      const result = await joinMetaverseRoomSession(session.id);
      setSession(result.session);
      setMessage('Accesso autorizzato. Il client realtime della stanza è ancora sperimentale e non viene avviato da questa pagina.');
    } catch (error) {
      setMessage(error.status === 401 ? 'Accedi nuovamente per entrare nella stanza.' : error.message);
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
        {session ? (
          <div className="metaverse-panel">
            <h3>Sessione {stateLabel(session.state)}</h3>
            <p>{session.participantCount} partecipanti su {session.capacity}</p>
            {live && authenticated && (
              <button className="metaverse-primary" onClick={join} disabled={joining}>
                {joining ? 'Accesso…' : 'Richiedi accesso alla sessione'}
              </button>
            )}
            {live && !authenticated && <p><a href="/social-login?returnTo=%2Fmetaverse">Accedi per entrare nella sessione.</a></p>}
            {!live && <p className="metaverse-muted">La sessione non è ancora live.</p>}
          </div>
        ) : (
          <p className="metaverse-muted">Nessuna sessione programmata o live.</p>
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

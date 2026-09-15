import React, { useEffect, useState } from 'react';
import {
  cancelMetaverseRoomSession,
  createMetaverseRoomInvite,
  createMetaverseRoomSession,
  endMetaverseRoomSession,
  getMetaverseRoom,
  getMetaverseRoomBlocklist,
  getMetaverseRoomInviteStatus,
  getMetaverseRoomParticipants,
  getMetaverseRoomSessionEvents,
  getMetaverseStageRequests,
  getMetaverseStageSpeakers,
  getMetaverseStageStatus,
  joinMetaverseRoomSession,
  leaveMetaverseRoomSession,
  leaveMetaverseStage,
  moderateMetaverseRoomParticipant,
  redeemMetaverseRoomInvite,
  requestMetaverseStageAccess,
  resolveMetaverseStageRequest,
  revokeMetaverseStageSpeaker,
  revokeMetaverseRoomInvite,
  startMetaverseRoomSession,
  unblockMetaverseRoomParticipant,
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

function toLocalDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
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
  const [editStagePolicy, setEditStagePolicy] = useState('host-only');
  const [editScheduledFor, setEditScheduledFor] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteStatus, setInviteStatus] = useState({ active: false, expiresAt: null });
  const [participants, setParticipants] = useState([]);
  const [blockedParticipants, setBlockedParticipants] = useState([]);
  const [stage, setStage] = useState({ policy: 'host-only', requested: false, speaker: false });
  const [stageRequests, setStageRequests] = useState([]);
  const [stageSpeakers, setStageSpeakers] = useState([]);

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
        setEditStagePolicy(result.room.stagePolicy);
        setEditScheduledFor(toLocalDateTimeInput(result.room.scheduledFor));
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

  useEffect(() => {
    if (!canManage || !room?.id) {
      setBlockedParticipants([]);
      return undefined;
    }
    let active = true;
    const refresh = () => getMetaverseRoomBlocklist(room.slug || room.id)
      .then((result) => { if (active) setBlockedParticipants(result.participants || []); })
      .catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [canManage, room?.id, room?.slug]);

  useEffect(() => {
    if (!canManage || session?.state !== 'live') {
      setParticipants([]);
      return undefined;
    }
    let active = true;
    const refresh = () => getMetaverseRoomParticipants(session.id)
      .then((result) => { if (active) setParticipants(result.participants || []); })
      .catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [canManage, session?.id, session?.state]);

  useEffect(() => {
    if (!joined || session?.state !== 'live') return undefined;
    let active = true;
    const refresh = () => getMetaverseStageStatus(session.id)
      .then((result) => { if (active) setStage(result.stage); })
      .catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [joined, session?.id, session?.state]);

  useEffect(() => {
    if (!canManage || session?.state !== 'live') {
      setStageRequests([]);
      return undefined;
    }
    let active = true;
    const refresh = () => getMetaverseStageRequests(session.id).then((result) => { if (active) setStageRequests(result.requests || []); }).catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [canManage, session?.id, session?.state]);

  const leaveStage = async () => {
    try {
      const result = await leaveMetaverseStage(session.id);
      setStage((current) => ({ ...current, ...result.stage }));
      setMessage(stage.speaker ? 'Hai lasciato il palco.' : 'Richiesta di parola annullata.');
    } catch (error) { setMessage(error.message); }
  };

  const requestStage = async () => {
    try {
      const result = await requestMetaverseStageAccess(session.id);
      setStage(result.stage);
      setMessage('Richiesta di parola inviata all’host.');
    } catch (error) { setMessage(error.message); }
  };

  const resolveStage = async (participantRef, approve) => {
    try {
      await resolveMetaverseStageRequest(session.id, participantRef, approve);
      setStageRequests((current) => current.filter((request) => request.ref !== participantRef));
      setMessage(approve ? 'Accesso al palco approvato.' : 'Richiesta di parola rifiutata.');
    } catch (error) { setMessage(error.message); }
  };

  useEffect(() => {
    if (!canManage || session?.state !== 'live') {
      setStageSpeakers([]);
      return undefined;
    }
    let active = true;
    const refresh = () => getMetaverseStageSpeakers(session.id).then((result) => { if (active) setStageSpeakers(result.speakers || []); }).catch(() => {});
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [canManage, session?.id, session?.state]);

  const revokeSpeaker = async (participantRef) => {
    try {
      await revokeMetaverseStageSpeaker(session.id, participantRef);
      setStageSpeakers((current) => current.filter((speaker) => speaker.ref !== participantRef));
      setMessage('Accesso al palco revocato.');
    } catch (error) { setMessage(error.message); }
  };

  const moderateParticipant = async (participantRef, block) => {
    setJoining(true);
    setMessage('');
    try {
      const result = await moderateMetaverseRoomParticipant(session.id, participantRef, block);
      setSession(result.session);
      setParticipants((current) => current.filter((participant) => participant.ref !== participantRef));
      setMessage(block ? 'Partecipante rimosso e bloccato.' : 'Partecipante rimosso dalla sessione.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setJoining(false);
    }
  };

  const unblockParticipant = async (participantRef) => {
    setJoining(true);
    setMessage('');
    try {
      await unblockMetaverseRoomParticipant(room.slug || room.id, participantRef);
      setBlockedParticipants((current) => current.filter((participant) => participant.ref !== participantRef));
      setMessage('Accesso del partecipante ripristinato.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setJoining(false);
    }
  };

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
        capacity: Number(editCapacity),
        stagePolicy: editStagePolicy,
        scheduledFor: editScheduledFor ? new Date(editScheduledFor).toISOString() : null
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

  const cancelScheduledSession = async () => {
    setJoining(true);
    setMessage('');
    try {
      await cancelMetaverseRoomSession(session.id);
      setSession(null);
      setRoom((current) => ({ ...current, state: 'published' }));
      setMessage('Sessione annullata. Puoi modificare le impostazioni e riprogrammarla.');
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
        <p><strong>Programmazione:</strong> {room.scheduledFor ? new Date(room.scheduledFor).toLocaleString('it-IT') : 'Avvio immediato'}</p>
        {canManage && (
          <div className="metaverse-panel">
            <h3>Controlli host</h3>
            <p className="metaverse-muted">Le transizioni sono validate dal server e non possono tornare indietro.</p>
            {['draft', 'published'].includes(room.state) && !session && (
              <form className="metaverse-form" onSubmit={saveSettings}>
                <label>Accesso<select value={editAccess} onChange={(event) => setEditAccess(event.target.value)}><option value="public">Pubblico</option><option value="authenticated">Solo account</option><option value="private">Privato</option></select></label>
                <label>Capacità<input type="number" min="1" max="500" value={editCapacity} onChange={(event) => setEditCapacity(event.target.value)} /></label>
                <label>Palco<select value={editStagePolicy} onChange={(event) => setEditStagePolicy(event.target.value)}><option value="host-only">Solo host</option><option value="host-approved">Richieste approvate dall’host</option></select></label>
                <label>Data e ora della sessione<input type="datetime-local" value={editScheduledFor} onChange={(event) => setEditScheduledFor(event.target.value)} /></label>
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
            {blockedParticipants.length > 0 && (
              <div className="metaverse-panel"><h4>Account bloccati</h4>{blockedParticipants.map((participant) => (
                <div key={participant.ref}><span>{participant.characterName} · {participant.archetype}</span> <button type="button" onClick={() => unblockParticipant(participant.ref)} disabled={joining}>Ripristina accesso</button></div>
              ))}</div>
            )}
            {room.state === 'draft' && <button className="metaverse-primary" onClick={manageLifecycle} disabled={joining}>Pubblica stanza</button>}
            {room.state === 'published' && !session && <button className="metaverse-primary" onClick={manageLifecycle} disabled={joining}>Crea sessione</button>}
            {session?.state === 'scheduled' && <button className="metaverse-primary" onClick={manageLifecycle} disabled={joining}>Avvia sessione</button>}
            {session?.state === 'scheduled' && <button type="button" onClick={cancelScheduledSession} disabled={joining}>Annulla sessione programmata</button>}
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
            {live && joined && stage.policy === 'host-approved' && !stage.requested && !stage.speaker && <button onClick={requestStage}>Richiedi di parlare</button>}
            {stage.requested && <p className="metaverse-muted">Richiesta di parola in attesa. <button onClick={leaveStage}>Annulla richiesta</button></p>}
            {stage.speaker && <p className="metaverse-muted">Hai accesso al palco. <button onClick={leaveStage}>Lascia palco</button></p>}
            {live && canManage && <button onClick={end} disabled={joining}>Concludi sessione</button>}
            {live && canManage && stageSpeakers.length > 0 && (
              <div className="metaverse-panel"><h4>Partecipanti sul palco</h4>{stageSpeakers.map((speaker) => (
                <div key={speaker.ref}><span>{speaker.characterName} · {speaker.archetype}</span> <button onClick={() => revokeSpeaker(speaker.ref)}>Revoca palco</button></div>
              ))}</div>
            )}
            {live && canManage && stageRequests.length > 0 && (
              <div className="metaverse-panel"><h4>Richieste di parola</h4>{stageRequests.map((request) => (
                <div key={request.ref}><span>{request.characterName} · {request.archetype}</span> <button onClick={() => resolveStage(request.ref, true)}>Approva</button> <button onClick={() => resolveStage(request.ref, false)}>Rifiuta</button></div>
              ))}</div>
            )}
            {live && canManage && participants.length > 0 && (
              <div className="metaverse-panel"><h4>Moderazione partecipanti</h4>{participants.map((participant) => (
                <div key={participant.ref}><span>{participant.characterName} · {participant.archetype}</span> <button onClick={() => moderateParticipant(participant.ref, false)} disabled={joining}>Rimuovi</button> <button onClick={() => moderateParticipant(participant.ref, true)} disabled={joining}>Rimuovi e blocca</button></div>
              ))}</div>
            )}
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

export { stateLabel, toLocalDateTimeInput };
export default MetaverseRoomPage;

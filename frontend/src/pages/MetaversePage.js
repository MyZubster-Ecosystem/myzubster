import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  createMetaverseEventSource,
  joinMetaverse,
  leaveMetaverse,
  moveMetaversePlayer,
  sendMetaverseChat,
  sendMetaverseEmote
} from '../api/metaverse';
import './MetaversePage.css';

const STORAGE_KEY = 'myz-metaverse-profile-v1';

const ARCHETYPES = {
  guardian: { label: 'Guardian', glyph: '🛡️' },
  explorer: { label: 'Explorer', glyph: '🧭' },
  maker: { label: 'Maker', glyph: '🛠️' },
  chronicler: { label: 'Chronicler', glyph: '📖' },
  scientist: { label: 'Scientist', glyph: '🔬' }
};

const EMOTES = {
  wave: '👋',
  spark: '✨',
  idea: '💡',
  leaf: '🌱'
};

const LANDMARKS = [
  { id: 'identity', label: 'Identity Hall', icon: '🪪', x: 12, y: 15 },
  { id: 'visual', label: 'Visual Gallery', icon: '🎨', x: 72, y: 14 },
  { id: 'zorgax', label: 'Zorgax Observatory', icon: '👁️', x: 68, y: 62 },
  { id: 'creator', label: 'Creator Lab', icon: '⚙️', x: 15, y: 62 }
];

function savedProfile() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (value && value.displayName && value.characterName) return value;
  } catch (_error) {}
  return null;
}

function guestCharacterName(displayName) {
  const base = displayName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 10)
    .toUpperCase() || 'EXPLORER';

  let suffix = Math.floor(Math.random() * 900) + 100;
  if (globalThis.crypto?.getRandomValues) {
    const random = new Uint16Array(1);
    globalThis.crypto.getRandomValues(random);
    suffix = 100 + (random[0] % 900);
  }

  return `${base}-${suffix}`;
}

function AvatarCreator({ initialProfile, busy, error, onEnter }) {
  const [displayName, setDisplayName] = useState(initialProfile?.displayName || '');

  const submit = (event) => {
    event.preventDefault();
    const cleanName = displayName.trim();
    if (!cleanName) return;

    onEnter({
      displayName: cleanName,
      characterName: initialProfile?.characterName || guestCharacterName(cleanName),
      archetype: initialProfile?.archetype || 'explorer',
      myzId: initialProfile?.myzId || ''
    });
  };

  return (
    <div className="metaverse-entry-shell">
      <section className="metaverse-entry-card">
        <div className="metaverse-kicker">MYZUBSTER WORLD</div>
        <h2>Entra nel mondo</h2>
        <p>
          Scegli un nome e inizia subito. Il personaggio viene creato automaticamente;
          potrai personalizzarlo più avanti.
        </p>

        <form onSubmit={submit} className="metaverse-form">
          <label>
            Il tuo nome pubblico
            <input
              autoFocus
              autoComplete="nickname"
              maxLength={30}
              minLength={2}
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Come vuoi farti chiamare?"
            />
          </label>

          {error && <div className="metaverse-error">{error}</div>}

          <button className="metaverse-primary" type="submit" disabled={busy}>
            {busy ? 'Ingresso…' : 'Entra'}
          </button>
        </form>

        <small className="metaverse-muted">
          Nessun wallet, documento o account GitHub richiesto per esplorare come ospite.
        </small>
      </section>
    </div>
  );
}

function MetaversePage() {
  const initialProfile = useMemo(savedProfile, []);
  const [profile, setProfile] = useState(initialProfile);
  const [sessionId, setSessionId] = useState(null);
  const [players, setPlayers] = useState({});
  const [messages, setMessages] = useState([]);
  const [chatText, setChatText] = useState('');
  const [status, setStatus] = useState('offline');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [lastLandmark, setLastLandmark] = useState('Neon Plaza');
  const emoteTimers = useRef({});

  const enter = async (nextProfile) => {
    setBusy(true);
    setError('');
    try {
      const result = await joinMetaverse(nextProfile);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
      setProfile(nextProfile);
      setSessionId(result.sessionId);
      setPlayers(Object.fromEntries(result.players.map((player) => [player.id, player])));
      setStatus('online');
    } catch (joinError) {
      setError(joinError.message);
      setStatus('offline');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return undefined;

    const source = createMetaverseEventSource(sessionId);
    source.onopen = () => setStatus('online');
    source.onerror = () => setStatus('reconnecting');
    source.onmessage = (event) => {
      let payload;
      try { payload = JSON.parse(event.data); } catch (_error) { return; }

      if (payload.type === 'snapshot') {
        setPlayers(Object.fromEntries(payload.players.map((player) => [player.id, player])));
      }

      if (payload.type === 'join' || payload.type === 'move') {
        setPlayers((current) => ({ ...current, [payload.player.id]: { ...current[payload.player.id], ...payload.player } }));
      }

      if (payload.type === 'leave') {
        setPlayers((current) => {
          const next = { ...current };
          delete next[payload.sessionId];
          return next;
        });
      }

      if (payload.type === 'chat') {
        setMessages((current) => [...current.slice(-39), payload.message]);
      }

      if (payload.type === 'emote') {
        setPlayers((current) => {
          const player = current[payload.sessionId];
          if (!player) return current;
          return { ...current, [payload.sessionId]: { ...player, emote: payload.emote } };
        });

        clearTimeout(emoteTimers.current[payload.sessionId]);
        emoteTimers.current[payload.sessionId] = setTimeout(() => {
          setPlayers((current) => {
            const player = current[payload.sessionId];
            if (!player) return current;
            return { ...current, [payload.sessionId]: { ...player, emote: null } };
          });
        }, 1800);
      }
    };

    return () => source.close();
  }, [sessionId]);

  const moveBy = (dx, dy) => {
    if (!sessionId) return;

    let target = null;
    setPlayers((current) => {
      const me = current[sessionId];
      if (!me) return current;
      const x = Math.min(96, Math.max(4, me.x + dx));
      const y = Math.min(88, Math.max(8, me.y + dy));
      target = { x, y };
      return { ...current, [sessionId]: { ...me, x, y } };
    });

    if (target) moveMetaversePlayer(sessionId, target.x, target.y).catch(() => {});
  };

  useEffect(() => {
    if (!sessionId) return undefined;
    const keydown = (event) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const movement = {
        ArrowUp: [0, -2.5], w: [0, -2.5], W: [0, -2.5],
        ArrowDown: [0, 2.5], s: [0, 2.5], S: [0, 2.5],
        ArrowLeft: [-2.5, 0], a: [-2.5, 0], A: [-2.5, 0],
        ArrowRight: [2.5, 0], d: [2.5, 0], D: [2.5, 0]
      }[event.key];
      if (!movement) return;
      event.preventDefault();
      moveBy(...movement);
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  });

  const me = sessionId ? players[sessionId] : null;
  const nearby = useMemo(() => {
    if (!me) return [];
    return Object.values(players).filter((player) => {
      if (player.id === me.id) return false;
      const distance = Math.hypot(player.x - me.x, player.y - me.y);
      return distance < 13;
    });
  }, [me, players]);

  useEffect(() => {
    if (!me) return;
    const landmark = LANDMARKS.find((item) => Math.hypot(item.x - me.x, item.y - me.y) < 14);
    setLastLandmark(landmark ? landmark.label : 'Neon Plaza');
  }, [me]);

  const submitChat = async (event) => {
    event.preventDefault();
    const value = chatText.trim();
    if (!value || !sessionId) return;
    setChatText('');
    try {
      await sendMetaverseChat(sessionId, value);
    } catch (chatError) {
      setError(chatError.message);
    }
  };

  const emote = (name) => {
    if (!sessionId) return;
    sendMetaverseEmote(sessionId, name).catch(() => {});
  };

  const resetProfile = async () => {
    if (sessionId) await leaveMetaverse(sessionId).catch(() => {});
    localStorage.removeItem(STORAGE_KEY);
    setSessionId(null);
    setPlayers({});
    setMessages([]);
    setProfile(null);
    setStatus('offline');
  };

  if (!sessionId) {
    return <AvatarCreator initialProfile={profile} busy={busy} error={error} onEnter={enter} />;
  }

  return (
    <div className="metaverse-page">
      <header className="metaverse-topbar">
        <div>
          <strong>🪐 MyZubster World</strong>
          <span className={`metaverse-status status-${status}`}>{status}</span>
        </div>
        <div className="metaverse-topbar-meta">
          <span>{Object.keys(players).length} online</span>
          <span>{lastLandmark}</span>
          <button onClick={resetProfile}>Cambia personaggio</button>
        </div>
      </header>

      <main className="metaverse-layout">
        <section className="metaverse-world" aria-label="MyZubster Neon Plaza interactive world">
          <div className="metaverse-grid" />
          <div className="metaverse-core">MYZ<br /><small>NEON PLAZA</small></div>

          {LANDMARKS.map((landmark) => (
            <div key={landmark.id} className="metaverse-landmark" style={{ left: `${landmark.x}%`, top: `${landmark.y}%` }}>
              <span>{landmark.icon}</span>
              <strong>{landmark.label}</strong>
            </div>
          ))}

          {Object.values(players).map((player) => {
            const archetype = ARCHETYPES[player.archetype] || ARCHETYPES.explorer;
            const isMe = player.id === sessionId;
            return (
              <div
                key={player.id}
                className={`metaverse-avatar archetype-${player.archetype} ${isMe ? 'is-me' : ''}`}
                style={{ left: `${player.x}%`, top: `${player.y}%` }}
                title={`${player.characterName} — ${player.displayName}`}
              >
                {player.emote && <div className="metaverse-emote">{EMOTES[player.emote] || '✨'}</div>}
                <div className="metaverse-avatar-body">{archetype.glyph}</div>
                <strong>{player.characterName}</strong>
                <small>{isMe ? 'TU · ' : ''}{player.identityStatus === 'verified' ? 'MYZ VERIFIED' : 'OSPITE'}</small>
              </div>
            );
          })}

          <div className="metaverse-controls" aria-label="Movement controls">
            <button onClick={() => moveBy(0, -2.5)}>▲</button>
            <div>
              <button onClick={() => moveBy(-2.5, 0)}>◀</button>
              <button onClick={() => moveBy(0, 2.5)}>▼</button>
              <button onClick={() => moveBy(2.5, 0)}>▶</button>
            </div>
            <small>WASD / frecce</small>
          </div>
        </section>

        <aside className="metaverse-sidebar">
          <section className="metaverse-panel">
            <h3>Il tuo personaggio</h3>
            <div className="metaverse-profile-line">
              <span className="metaverse-profile-glyph">{ARCHETYPES[me?.archetype]?.glyph || '🧭'}</span>
              <div>
                <strong>{me?.characterName}</strong>
                <small>{profile?.displayName}</small>
              </div>
            </div>
            <div className="metaverse-identity-badge">Ospite</div>
          </section>

          <section className="metaverse-panel">
            <h3>Persone vicine</h3>
            {nearby.length === 0 ? <p className="metaverse-muted">Muoviti nella Plaza per incontrare qualcuno.</p> : nearby.map((player) => (
              <div className="metaverse-nearby" key={player.id}>
                <span>{ARCHETYPES[player.archetype]?.glyph || '🧭'}</span>
                <div><strong>{player.characterName}</strong><small>{player.displayName}</small></div>
              </div>
            ))}
          </section>

          <section className="metaverse-panel">
            <h3>Emote</h3>
            <div className="metaverse-emote-row">
              {Object.entries(EMOTES).map(([name, glyph]) => <button key={name} onClick={() => emote(name)} title={name}>{glyph}</button>)}
            </div>
          </section>

          <section className="metaverse-panel metaverse-chat-panel">
            <h3>Chat</h3>
            <div className="metaverse-chat-log">
              {messages.length === 0 && <p className="metaverse-muted">Nessun messaggio.</p>}
              {messages.map((message) => (
                <div key={message.id} className="metaverse-chat-message">
                  <strong>{message.characterName}</strong>
                  <span>{message.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={submitChat} className="metaverse-chat-form">
              <input maxLength={280} value={chatText} onChange={(event) => setChatText(event.target.value)} placeholder="Scrivi un messaggio…" />
              <button type="submit">Invia</button>
            </form>
          </section>
        </aside>
      </main>

      {error && <div className="metaverse-toast" onClick={() => setError('')}>{error}</div>}
    </div>
  );
}

export default MetaversePage;

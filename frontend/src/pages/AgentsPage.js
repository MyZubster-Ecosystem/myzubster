import React, { useEffect, useMemo, useRef, useState } from 'react';
import canonicalEntities from '../data/canonicalEntities.json';
import { askEntity, getCanonicalEntities, getEntityStatus } from '../api/entities';
import './AgentsPage.css';

function initialEntity() {
  const requested = window.location.hash.replace(/^#/, '');
  return canonicalEntities.some(entity => entity.slug === requested) ? requested : 'zorgax';
}

function localGuidance(entity, question) {
  return {
    mode: 'browser-fallback',
    provider: 'local-registry',
    message: [
      `${entity.icon} ${entity.displayName} è disponibile in modalità guida locale.`,
      `Richiesta ricevuta: “${question.trim().slice(0, 180)}”.`,
      '',
      `Workflow: ${entity.workflow.join(' → ')}.`,
      `Primo passo: ${entity.suggestions[0]}.`,
      `Limite: ${entity.boundaries[0]}`,
      '',
      'La connessione API non è disponibile: nessun dato è stato inviato o memorizzato.'
    ].join('\n'),
    references: [{ label: entity.repository.name, url: entity.repository.url }]
  };
}

export default function AgentsPage() {
  const [entities, setEntities] = useState(canonicalEntities);
  const [selectedSlug, setSelectedSlug] = useState(initialEntity);
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState({});
  const [sending, setSending] = useState(false);
  const [registryMode, setRegistryMode] = useState('bundled');
  const [runtime, setRuntime] = useState({ mode: 'checking', label: 'Verifica motore…' });
  const bottomRef = useRef(null);

  const selected = entities.find(entity => entity.slug === selectedSlug) || entities[0];
  const conversation = messages[selected?.slug] || [];
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return entities;
    return entities.filter(entity => [entity.displayName, entity.role, entity.mission, ...entity.capabilities].join(' ').toLowerCase().includes(value));
  }, [entities, query]);

  useEffect(() => {
    getCanonicalEntities()
      .then(data => {
        setEntities(data);
        setRegistryMode('live');
      })
      .catch(() => setRegistryMode('bundled'));
  }, []);

  useEffect(() => {
    if (!selected) return;
    setRuntime({ mode: 'checking', label: 'Verifica motore…' });
    getEntityStatus(selected.slug)
      .then(status => setRuntime({
        mode: status.mode,
        label: status.mode === 'generative' && status.modelLoaded ? `AI locale · ${status.model}` : 'Guida canonica attiva'
      }))
      .catch(() => setRuntime({ mode: 'browser-fallback', label: 'Guida browser attiva' }));
  }, [selected?.slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.length, sending]);

  function selectEntity(slug) {
    setSelectedSlug(slug);
    window.history.replaceState(null, '', `${window.location.pathname}#${slug}`);
  }

  function append(slug, item) {
    setMessages(current => ({ ...current, [slug]: [...(current[slug] || []), item] }));
  }

  async function send(text = draft) {
    const value = String(text || '').trim();
    if (!value || !selected || sending) return;
    const slug = selected.slug;
    append(slug, { role: 'user', text: value });
    setDraft('');
    setSending(true);
    try {
      let data;
      try {
        data = await askEntity(slug, value);
      } catch (error) {
        data = localGuidance(selected, value);
      }
      append(slug, { role: 'assistant', text: data.message, mode: data.mode, references: data.references || [] });
      if (data.mode === 'generative') setRuntime({ mode: 'generative', label: `AI locale · ${data.model || 'Ollama'}` });
      else setRuntime({ mode: data.mode, label: 'Guida canonica attiva' });
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  }

  if (!selected) return <main className="entity-hub"><p>Registro entità non disponibile.</p></main>;

  return (
    <div className="entity-shell">
      <header className="entity-topbar">
        <a className="entity-brand" href="/">🌍 MyZubster</a>
        <div className="entity-topbar-copy">
          <strong>Entità canoniche</strong>
          <span>12 assistenti · repository separati · un’unica interfaccia</span>
        </div>
        <a className="entity-home-link" href="/">Torna alla home</a>
      </header>

      <main className="entity-hub">
        <section className="entity-hero">
          <div>
            <div className="entity-kicker">MYZUBSTER INTELLIGENCE NETWORK</div>
            <h1>Scegli l’entità giusta. Parla. Ottieni un prossimo passo verificabile.</h1>
            <p>Le conversazioni restano nella scheda del browser. Il server non salva memoria; ogni risposta indica se proviene dal motore AI o dalla guida canonica di fallback.</p>
          </div>
          <div className="entity-policy-card">
            <span className={`entity-status entity-status--${runtime.mode}`}>{runtime.label}</span>
            <strong>{registryMode === 'live' ? 'Registro API sincronizzato' : 'Registro integrato offline'}</strong>
            <small>MYZ: ledger interno · nessun settlement automatico</small>
          </div>
        </section>

        <div className="entity-layout">
          <aside className="entity-roster" aria-label="Entità disponibili">
            <label className="entity-search-label" htmlFor="entity-search">Cerca un’entità</label>
            <input id="entity-search" className="entity-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="MRV, sicurezza, mappe…" />
            <div className="entity-list">
              {filtered.map(entity => (
                <button
                  type="button"
                  key={entity.slug}
                  className={`entity-card ${entity.slug === selected.slug ? 'entity-card--active' : ''}`}
                  style={{ '--entity-accent': entity.accent }}
                  onClick={() => selectEntity(entity.slug)}
                >
                  <span className="entity-card-icon">{entity.icon}</span>
                  <span><strong>{entity.displayName}</strong><small>{entity.role}</small></span>
                </button>
              ))}
            </div>
          </aside>

          <section className="entity-console" style={{ '--entity-accent': selected.accent }}>
            <header className="entity-console-header">
              <div className="entity-avatar" aria-hidden="true">{selected.icon}</div>
              <div>
                <div className="entity-console-title"><h2>{selected.displayName}</h2><span>{selected.id}</span></div>
                <p>{selected.role}</p>
              </div>
              <div className="entity-console-links">
                {selected.advancedUrl && <a href={selected.advancedUrl}>Console avanzata</a>}
                <a href={selected.repository.url} target="_blank" rel="noreferrer">Repository ↗</a>
              </div>
            </header>

            <div className="entity-mission">
              <strong>Missione</strong><span>{selected.mission}</span>
              <div className="entity-workflow">{selected.workflow.map((step, index) => <React.Fragment key={step}><span>{step}</span>{index < selected.workflow.length - 1 && <b>→</b>}</React.Fragment>)}</div>
            </div>

            <div className="entity-chat" aria-live="polite">
              {conversation.length === 0 && (
                <div className="entity-welcome">
                  <div className="entity-welcome-icon">{selected.icon}</div>
                  <h3>Come posso aiutarti?</h3>
                  <p>Scegli una domanda rapida oppure scrivi una richiesta. I limiti dell’entità restano sempre attivi.</p>
                  <div className="entity-suggestions">
                    {selected.suggestions.map(suggestion => <button type="button" key={suggestion} onClick={() => send(suggestion)}>{suggestion}</button>)}
                  </div>
                </div>
              )}
              {conversation.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`entity-message entity-message--${message.role}`}>
                  <strong>{message.role === 'user' ? 'Tu' : selected.displayName}</strong>
                  <div>{message.text}</div>
                  {message.mode && <small>{message.mode === 'generative' ? 'Risposta AI locale' : 'Guida canonica di fallback'}</small>}
                  {message.references?.length > 0 && <div className="entity-references">Riferimenti: {message.references.map(reference => <a key={reference.url} href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a>)}</div>}
                </article>
              ))}
              {sending && <div className="entity-typing"><span /><span /><span /> {selected.displayName} sta elaborando…</div>}
              <div ref={bottomRef} />
            </div>

            <div className="entity-composer">
              <textarea
                aria-label={`Scrivi a ${selected.displayName}`}
                value={draft}
                onChange={event => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                maxLength={4000}
                placeholder={`Scrivi a ${selected.displayName}…`}
                disabled={sending}
              />
              <button type="button" onClick={() => send()} disabled={sending || !draft.trim()}>Invia</button>
              <div className="entity-composer-meta"><span>Invio: Enter · nuova riga: Shift+Enter</span><button type="button" onClick={() => setMessages(current => ({ ...current, [selected.slug]: [] }))}>Cancella chat locale</button></div>
            </div>

            <footer className="entity-boundary">
              <strong>Confini attivi</strong>
              <ul>{selected.boundaries.map(boundary => <li key={boundary}>{boundary}</li>)}</ul>
            </footer>
          </section>
        </div>
      </main>
    </div>
  );
}

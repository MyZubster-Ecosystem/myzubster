import React, { useEffect, useMemo, useRef, useState } from 'react';

const ORG = 'MyZubster-Ecosystem';
const REPO = 'https://github.com/MyZubster-Ecosystem/myzubster';
const JOIN = `${REPO}/blob/main/JOIN.md`;
const CHARACTER_REGISTRY = `${REPO}/issues/617`;
const VIEW_PATHS = {
  home: '/',
  register: '/account',
  municipality: '/comuni',
  gardens: '/orti',
  repos: '/repositories',
  life: '/life',
};

const shell = { minHeight: '100vh', background: '#071018', color: '#f8fafc' };
const card = { background: '#0f1b27', border: '1px solid #213547', borderRadius: 18, padding: 18 };
const input = { width: '100%', padding: '12px 13px', borderRadius: 11, border: '1px solid #334155', background: '#08131d', color: '#fff', fontSize: 16, boxSizing: 'border-box' };
const primary = { border: 0, borderRadius: 11, padding: '12px 16px', background: '#0ea5e9', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 15 };
const secondary = { ...primary, background: '#182938' };
const linkButton = { ...primary, display: 'inline-block', textDecoration: 'none', textAlign: 'center' };
const outlineLink = { ...linkButton, background: '#10202e', border: '1px solid #2d5266' };

function LifePortalPage({ initialView = 'home', onNavigate, openLegacy }) {
  const [view, setView] = useState(initialView);
  const [register, setRegister] = useState({ username: '', email: '', password: '', moneroWallet: '' });
  const [showXmr, setShowXmr] = useState(false);
  const [registerStatus, setRegisterStatus] = useState('');
  const [municipality, setMunicipality] = useState({ name: '', province: '', region: '', contactEmail: '' });
  const [municipalityStatus, setMunicipalityStatus] = useState('');
  const [repos, setRepos] = useState([]);
  const [repoStatus, setRepoStatus] = useState('loading');
  const [repoQuery, setRepoQuery] = useState('');
  const isInitialRender = useRef(true);

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    document.getElementById('main-content')?.focus();
  }, [view]);

  const goToView = (nextView) => {
    const nextPath = VIEW_PATHS[nextView];
    if (onNavigate && nextPath) onNavigate(nextPath);
    else setView(nextView);
  };

  useEffect(() => {
    fetch(`https://api.github.com/orgs/${ORG}/repos?per_page=100&sort=updated`)
      .then(r => {
        if (!r.ok) throw new Error('Repository request failed');
        return r.json();
      })
      .then(data => {
        setRepos(Array.isArray(data) ? data : []);
        setRepoStatus('ready');
      })
      .catch(() => {
        setRepos([]);
        setRepoStatus('error');
      });
  }, []);

  const repoStatusText = repoStatus === 'error'
    ? 'Repository temporaneamente non disponibili.'
    : repoStatus === 'ready'
      ? `${repos.length} repository pubblici indicizzati.`
      : 'Caricamento repository…';

  const filteredRepos = useMemo(() => {
    const q = repoQuery.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter(r => [r.name, r.description, r.language, ...(r.topics || [])].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [repos, repoQuery]);

  async function submitRegistration(e) {
    e.preventDefault();
    setRegisterStatus('Registrazione in corso…');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(register),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Registrazione non riuscita');
      if (data.data?.token) localStorage.setItem('myzubster-token', data.data.token);
      setRegisterStatus('Account creato. Benvenuto in MyZubster.');
      setRegister({ username: '', email: '', password: '', moneroWallet: '' });
      setShowXmr(false);
    } catch (error) {
      setRegisterStatus(error.message);
    }
  }

  async function submitMunicipality(e) {
    e.preventDefault();
    setMunicipalityStatus('Invio in corso…');
    try {
      const response = await fetch('/api/municipalities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(municipality),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Registrazione ente non riuscita');
      setMunicipalityStatus('Comune / ente registrato.');
      setMunicipality({ name: '', province: '', region: '', contactEmail: '' });
    } catch (error) {
      setMunicipalityStatus(error.message);
    }
  }

  const actions = [
    ['identity', '🪪', 'Identità MyZubster', 'Crea o importa un’identità e collegala facoltativamente a GitHub.'],
    ['register', '👤', 'Account MyZubster', 'Crea un account per le funzioni applicative che richiedono autenticazione.'],
    ['agents', '🧠', 'Entità AI', 'Parla con le 12 entità canoniche e ottieni un prossimo passo verificabile.'],
    ['entity-bounties', '🎯', 'Bounty entità', 'Completa le entità e i visual kit con criteri ed evidenze verificabili.'],
    ['zorgax', '✨', 'Zorgax AI', 'Esplora il progetto con l’AI pubblica, senza account.'],
    ['municipality', '🏛️', 'Comuni', 'Registra un Comune o un ente territoriale.'],
    ['gardens', '🌱', 'Orti & Pilot', 'Accedi agli orti, al verde urbano e ai siti pilota.'],
    ['repos', '💻', 'Open Source', 'Esplora tutti i repository pubblici MyZubster.'],
    ['life', '💧', 'LIFE 2026', 'Acqua, circolarità, MRV e replicazione territoriale.'],
  ];

  const contributorPaths = [
    ['🧑‍💻', 'Sviluppa', 'Codice, test, API, frontend, backend, DevOps e documentazione.'],
    ['🎨', 'Crea', 'Visual, fumetti, UX, personaggi, traduzioni e storytelling.'],
    ['📷', 'Osserva', 'Foto e osservazioni reali pubbliche o autorizzate, con provenance.'],
    ['🔬', 'Ricerca', 'Dataset, ambiente, IoT, GIS, privacy, Monero e verifiche tecniche.'],
    ['🧪', 'Testa', 'Riproduci bug, prova workflow e migliora accessibilità e usabilità.'],
    ['🌍', 'Partecipa', 'Anche senza esperienza: leggi JOIN.md e scegli una prima missione semplice.'],
  ];

  return (
    <div style={shell}>
      <a href="#main-content" style={{ position: 'absolute', left: 12, top: 12, zIndex: 10, padding: '10px 14px', borderRadius: 9, background: '#f8fafc', color: '#071018', fontWeight: 800, transform: 'translateY(-200%)' }} onFocus={e => { e.currentTarget.style.transform = 'translateY(0)'; }} onBlur={e => { e.currentTarget.style.transform = 'translateY(-200%)'; }}>Vai al contenuto principale</a>
      <header style={{ borderBottom: '1px solid #1f3342', background: '#09141e', position: 'sticky', top: 0, zIndex: 5 }}>
        <nav aria-label="Navigazione principale" style={{ maxWidth: 1160, margin: '0 auto', padding: '13px 16px', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button onClick={() => goToView('home')} style={{ background: 'none', border: 0, color: '#fff', cursor: 'pointer', fontSize: 20, fontWeight: 900 }}>🌍 MyZubster</button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={JOIN} target="_blank" rel="noreferrer" style={outlineLink}>Join MyZubster</a>
            <a href="/fumetto" style={outlineLink}>Fumetto</a>
            <a href="/entities" style={outlineLink}>Entità AI</a>
            <a href="/entity-bounties" style={outlineLink}>Bounty</a>
            <a href="/zorgax" style={linkButton}>Zorgax AI</a>
          </div>
        </nav>
      </header>

      <main id="main-content" tabIndex={-1} style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 16px 60px' }}>
        {view === 'home' && <>
          <section style={{ padding: '28px 0 18px' }}>
            <div style={{ color: '#67e8f9', fontWeight: 800, letterSpacing: 1, fontSize: 13 }}>MYZUBSTER · OPEN SOURCE · OPEN COMMUNITY</div>
            <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', lineHeight: 1.02, margin: '10px 0 12px', maxWidth: 930 }}>Entra in MyZubster. Osserva, crea, contribuisci e costruisci in pubblico.</h1>
            <p style={{ color: '#b6c5d1', fontSize: 18, lineHeight: 1.65, maxWidth: 880 }}>
              MyZubster è un ecosistema open source aperto a sviluppatori, designer, fotografi, ricercatori, traduttori, tester, Comuni e nuovi contributor. Non serve un invito privato per contribuire su GitHub e puoi usare un alias pubblico. L’account MyZubster è richiesto solo per le funzioni applicative che necessitano autenticazione.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
              <a href={JOIN} target="_blank" rel="noreferrer" style={linkButton}>🚀 Join MyZubster</a>
              <a href={REPO} target="_blank" rel="noreferrer" style={outlineLink}>💻 Explore GitHub</a>
              <a href={CHARACTER_REGISTRY} target="_blank" rel="noreferrer" style={outlineLink}>👾 Create Your Character</a>
              <a href="/fumetto" style={outlineLink}>📖 Explore the Chronicle</a>
            </div>
            <p style={{ color: '#7f95a4', lineHeight: 1.55, marginTop: 14, maxWidth: 850 }}>
              Participation is voluntary. No KYC or legal name is required for ordinary public GitHub contribution. A contribution, character, issue or PR does not automatically imply employment, partnership, payment or endorsement.
            </p>
          </section>

          <section style={{ ...card, marginTop: 14, borderColor: '#28566b', background: 'linear-gradient(135deg,#0d2030,#11192c)' }}>
            <div style={{ color: '#67e8f9', fontWeight: 800, fontSize: 13 }}>START HERE</div>
            <h2 style={{ margin: '8px 0 8px', fontSize: 28 }}>Non sai da dove iniziare?</h2>
            <p style={{ color: '#b6c5d1', lineHeight: 1.6, maxWidth: 840 }}>
              Apri la guida JOIN.md, scegli un percorso adatto alle tue competenze e parti da una issue o da una piccola proposta. Puoi contribuire anche senza creare un account sul sito.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a href={JOIN} target="_blank" rel="noreferrer" style={linkButton}>Leggi JOIN.md</a>
              <a href={`${REPO}/issues`} target="_blank" rel="noreferrer" style={outlineLink}>Trova una missione</a>
              <a href={`${REPO}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer" style={outlineLink}>Guida contributor</a>
            </div>
          </section>

          <section style={{ marginTop: 24 }}>
            <h2 style={{ marginBottom: 12 }}>Come puoi farne parte</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(245px,1fr))', gap: 12 }}>
              {contributorPaths.map(([icon, title, text]) => (
                <div key={title} style={card}>
                  <div aria-hidden="true" style={{ fontSize: 30 }}>{icon}</div>
                  <h3 style={{ margin: '10px 0 6px', fontSize: 20 }}>{title}</h3>
                  <div style={{ color: '#9fb0bd', lineHeight: 1.55 }}>{text}</div>
                </div>
              ))}
            </div>
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12, marginTop: 24 }}>
            {actions.map(([id, icon, title, text]) => (
              <button key={id} onClick={() => {
                if (id === 'agents') window.location.assign('/entities');
                else if (id === 'entity-bounties') window.location.assign('/entity-bounties');
                else if (id === 'zorgax') window.location.assign('/zorgax');
                else if (id === 'identity') window.location.assign('/onboarding');
                else goToView(id);
              }} style={{ ...card, textAlign: 'left', color: '#fff', cursor: 'pointer' }}>
                <div aria-hidden="true" style={{ fontSize: 30 }}>{icon}</div>
                <h2 style={{ margin: '10px 0 6px', fontSize: 20 }}>{title}</h2>
                <div style={{ color: '#9fb0bd', lineHeight: 1.5 }}>{text}</div>
              </button>
            ))}
          </section>

          <section style={{ ...card, marginTop: 16 }}>
            <h2 style={{ marginTop: 0 }}>Dal primo ingresso al World State</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 10 }}>
              {[
                ['1', 'Scopri', 'Esplora sito, fumetto, repository e documentazione.'],
                ['2', 'Scegli', 'Trova una missione o proponi una contribution adatta a te.'],
                ['3', 'Contribuisci', 'Apri issue o PR con codice, visual, dati o documentazione.'],
                ['4', 'Verifica', 'Review ed evidence distinguono proposta, contributo e stato verificato.'],
                ['5', 'Entra nel mondo', 'Un contributo accettato può essere collegato al tuo personaggio e al World State.'],
              ].map(([n, t, d]) => <div key={n} style={{ padding: 14, background: '#091621', borderRadius: 12 }}><strong style={{ color: '#67e8f9' }}>{n}. {t}</strong><div style={{ color: '#a8bac7', marginTop: 6 }}>{d}</div></div>)}
            </div>
          </section>
        </>}

        {view === 'register' && <section style={{ maxWidth: 620, margin: '12px auto' }}>
          <button onClick={() => goToView('home')} style={{ ...secondary, marginBottom: 12 }}>← Home</button>
          <div style={card}>
            <h1 style={{ marginTop: 0 }}>Crea il tuo account MyZubster</h1>
            <p style={{ color: '#a9bac7', lineHeight: 1.6 }}>L’account serve per le funzioni applicative che richiedono autenticazione. Per contribuire al codice pubblico puoi invece usare direttamente GitHub.</p>
            <form onSubmit={submitRegistration} style={{ display: 'grid', gap: 12 }}>
              <input required minLength={3} aria-label="Username" autoComplete="username" placeholder="Username" value={register.username} onChange={e => setRegister({ ...register, username: e.target.value })} style={input} />
              <input required type="email" aria-label="Email account" autoComplete="email" placeholder="Email" value={register.email} onChange={e => setRegister({ ...register, email: e.target.value })} style={input} />
              <input required minLength={6} type="password" aria-label="Password account" autoComplete="new-password" placeholder="Password (minimo 6 caratteri)" value={register.password} onChange={e => setRegister({ ...register, password: e.target.value })} style={input} />
              <label style={{ display: 'flex', gap: 9, alignItems: 'center', color: '#b5c4cf' }}>
                <input type="checkbox" checked={showXmr} onChange={e => setShowXmr(e.target.checked)} /> Aggiungi un indirizzo XMR pubblico (opzionale)
              </label>
              {showXmr && <>
                <input aria-label="Indirizzo pubblico Monero o XMR" autoComplete="off" placeholder="Indirizzo pubblico Monero/XMR" value={register.moneroWallet} onChange={e => setRegister({ ...register, moneroWallet: e.target.value.trim() })} style={input} />
                <small style={{ color: '#8fa4b3' }}>Non inserire mai seed phrase o chiavi private. MyZubster usa solo l’indirizzo pubblico.</small>
              </>}
              <button style={primary}>Registrati</button>
            </form>
            {registerStatus && <div role="status" aria-live="polite" style={{ marginTop: 12, color: registerStatus.startsWith('Account') ? '#86efac' : '#fbbf24' }}>{registerStatus}</div>}
          </div>
        </section>}

        {view === 'municipality' && <section style={{ maxWidth: 700, margin: '12px auto' }}>
          <button onClick={() => goToView('home')} style={{ ...secondary, marginBottom: 12 }}>← Home</button>
          <div style={card}>
            <h1 style={{ marginTop: 0 }}>Registra Comune / Ente</h1>
            <p style={{ color: '#a9bac7' }}>Modulo essenziale. I dettagli del pilot possono essere aggiunti dopo.</p>
            <form onSubmit={submitMunicipality} style={{ display: 'grid', gap: 12 }}>
              <input required aria-label="Nome Comune o Ente" autoComplete="organization" placeholder="Nome Comune / Ente" value={municipality.name} onChange={e => setMunicipality({ ...municipality, name: e.target.value })} style={input}/>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
                <input aria-label="Provincia" autoComplete="address-level2" placeholder="Provincia" value={municipality.province} onChange={e => setMunicipality({ ...municipality, province: e.target.value })} style={input}/>
                <input aria-label="Regione" autoComplete="address-level1" placeholder="Regione" value={municipality.region} onChange={e => setMunicipality({ ...municipality, region: e.target.value })} style={input}/>
              </div>
              <input type="email" aria-label="Email referente" autoComplete="email" placeholder="Email referente" value={municipality.contactEmail} onChange={e => setMunicipality({ ...municipality, contactEmail: e.target.value })} style={input}/>
              <button style={primary}>Registra ente</button>
            </form>
            {municipalityStatus && <div role="status" aria-live="polite" style={{ marginTop: 12, color: '#fbbf24' }}>{municipalityStatus}</div>}
          </div>
        </section>}

        {view === 'gardens' && <section>
          <button onClick={() => goToView('home')} style={{ ...secondary, marginBottom: 12 }}>← Home</button>
          <div style={card}>
            <h1 style={{ marginTop: 0 }}>Orti & Pilot</h1>
            <p style={{ color: '#a9bac7', lineHeight: 1.6 }}>Gestione di orti, verde urbano e siti dimostrativi con territorio, acqua, sensori, materiali, osservazioni e KPI/MRV.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => openLegacy && openLegacy('gardens')} style={primary}>Apri gestione orti</button>
              <button onClick={() => openLegacy && openLegacy('pilot')} style={secondary}>Apri dashboard pilot</button>
            </div>
          </div>
        </section>}

        {view === 'repos' && <section>
          <button onClick={() => goToView('home')} style={{ ...secondary, marginBottom: 12 }}>← Home</button>
          <div style={card}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <div><h1 style={{ margin: 0 }}>Repository MyZubster</h1><p role="status" aria-live="polite" style={{ color: repoStatus === 'error' ? '#fbbf24' : '#a9bac7' }}>{repoStatusText}</p></div>
              <a href={JOIN} target="_blank" rel="noreferrer" style={linkButton}>Come contribuire</a>
            </div>
            <input type="search" aria-label="Cerca repository" placeholder="Cerca per nome, linguaggio o argomento" value={repoQuery} onChange={e => setRepoQuery(e.target.value)} style={{ ...input, marginBottom: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 10 }}>
              {filteredRepos.map(r => <a key={r.id} href={r.html_url} target="_blank" rel="noreferrer" style={{ ...card, padding: 14, color: '#fff', textDecoration: 'none' }}>
                <strong style={{ color: '#67e8f9' }}>{r.name}</strong>
                <p style={{ color: '#9fb0bd' }}>{r.description || 'Repository pubblico MyZubster'}</p>
                <small style={{ color: '#8196a5' }}>{r.language || 'multi-language'} · aggiornato {new Date(r.updated_at).toLocaleDateString()}</small>
              </a>)}
            </div>
          </div>
        </section>}

        {view === 'life' && <section>
          <button onClick={() => goToView('home')} style={{ ...secondary, marginBottom: 12 }}>← Home</button>
          <div style={card}>
            <h1 style={{ marginTop: 0 }}>MyZubster LIFE 2026</h1>
            <p style={{ color: '#a9bac7', lineHeight: 1.7 }}>Struttura digitale per living lab territoriale, efficienza e riuso dell’acqua, circolarità, dati IoT, Monitoring Reporting & Verification e replicazione open-source. Questo percorso resta in esplorazione / pre-candidature finché l’evidenza pubblica non supporta uno stato più avanzato.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
              {['Circular Water','Digital MRV','Comuni & Territorio','Orti & Verde urbano','Open Source','Zorgax AI'].map(x => <div key={x} style={{ padding: 14, borderRadius: 12, background: '#091621' }}>{x}</div>)}
            </div>
          </div>
        </section>}
      </main>
    </div>
  );
}

export default LifePortalPage;

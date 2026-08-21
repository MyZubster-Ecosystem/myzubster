import React, { useEffect, useMemo, useState } from 'react';

const GATEWAY = process.env.REACT_APP_GATEWAY_URL || 'https://myzubster-gateway.vercel.app';
const ORG = 'MyZubster-Ecosystem';

const sections = [
  ['overview', 'LIFE Hub'],
  ['users', 'Utenti + XMR'],
  ['municipalities', 'Comuni'],
  ['gardens', 'Orti & Pilot'],
  ['repos', 'Repository'],
  ['zorgax', 'Zorgax AI'],
];

const box = {
  background: '#111827', border: '1px solid #263247', borderRadius: 18, padding: 18,
};

function Status({ children, kind = 'info' }) {
  const colors = { info: '#93c5fd', ok: '#86efac', error: '#fca5a5' };
  return <div style={{ color: colors[kind], marginTop: 10, fontSize: 14 }}>{children}</div>;
}

function LifePortalPage() {
  const [section, setSection] = useState('overview');
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', moneroWallet: '' });
  const [userStatus, setUserStatus] = useState(null);
  const [municipalityForm, setMunicipalityForm] = useState({ name: '', province: '', region: '', pec: '', contactEmail: '', website: '', notes: '' });
  const [municipalities, setMunicipalities] = useState([]);
  const [municipalityStatus, setMunicipalityStatus] = useState(null);
  const [repos, setRepos] = useState([]);
  const [repoQuery, setRepoQuery] = useState('');
  const [repoStatus, setRepoStatus] = useState('Caricamento repository…');

  useEffect(() => {
    fetch('/api/municipalities')
      .then(r => r.ok ? r.json() : Promise.reject(new Error('API Comuni non disponibile')))
      .then(d => setMunicipalities(d.data || d.municipalities || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`https://api.github.com/orgs/${ORG}/repos?per_page=100&sort=updated`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('GitHub non disponibile')))
      .then(data => {
        setRepos(Array.isArray(data) ? data : []);
        setRepoStatus(`${Array.isArray(data) ? data.length : 0} repository pubblici indicizzati`);
      })
      .catch(err => setRepoStatus(err.message));
  }, []);

  const filteredRepos = useMemo(() => {
    const q = repoQuery.trim().toLowerCase();
    if (!q) return repos;
    return repos.filter(r => [r.name, r.description, r.language, ...(r.topics || [])].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [repos, repoQuery]);

  async function registerUser(e) {
    e.preventDefault();
    setUserStatus({ kind: 'info', text: 'Registrazione in corso…' });
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.message || 'Registrazione non riuscita');
      if (d.data?.token) localStorage.setItem('myzubster-token', d.data.token);
      setUserStatus({ kind: 'ok', text: 'Utente registrato. Il wallet XMR resta non-custodial: MyZubster conserva solo l’indirizzo pubblico.' });
      setUserForm({ username: '', email: '', password: '', moneroWallet: '' });
    } catch (err) {
      setUserStatus({ kind: 'error', text: err.message });
    }
  }

  async function registerMunicipality(e) {
    e.preventDefault();
    setMunicipalityStatus({ kind: 'info', text: 'Registrazione Comune in corso…' });
    try {
      const r = await fetch('/api/municipalities', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(municipalityForm),
      });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.message || 'Registrazione non riuscita');
      setMunicipalities(prev => [d.data, ...prev]);
      setMunicipalityStatus({ kind: 'ok', text: 'Comune registrato nel registro LIFE/MyZubster.' });
      setMunicipalityForm({ name: '', province: '', region: '', pec: '', contactEmail: '', website: '', notes: '' });
    } catch (err) {
      setMunicipalityStatus({ kind: 'error', text: err.message });
    }
  }

  const inputStyle = { width: '100%', padding: 11, borderRadius: 10, border: '1px solid #334155', background: '#0b1220', color: '#fff' };
  const buttonStyle = { border: 0, borderRadius: 11, padding: '11px 15px', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 700 };

  return (
    <div style={{ minHeight: '100vh', background: '#080d18', color: '#f8fafc', padding: '22px 16px 48px' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ marginBottom: 22 }}>
          <div style={{ color: '#67e8f9', fontSize: 13, letterSpacing: 1.2, fontWeight: 800 }}>MYZUBSTER · LIFE 2026 DIGITAL INFRASTRUCTURE</div>
          <h1 style={{ fontSize: 'clamp(30px,5vw,54px)', lineHeight: 1.03, margin: '8px 0 10px' }}>Territorio, acqua, circolarità e dati verificabili.</h1>
          <p style={{ color: '#a8b4c7', maxWidth: 850, fontSize: 17, lineHeight: 1.55, margin: 0 }}>
            Portale unico per cittadini, Comuni, orti e siti pilota, repository open-source, MRV ambientale e accesso pubblico a Zorgax AI.
          </p>
        </header>

        <nav style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {sections.map(([id, label]) => <button key={id} onClick={() => setSection(id)} style={{ ...buttonStyle, background: section === id ? '#0ea5e9' : '#172033' }}>{label}</button>)}
        </nav>

        {section === 'overview' && <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            {[
              ['1', 'Living Lab', 'Cesena–Rimini come area dimostrativa e replicabile.'],
              ['2', 'Circular Water', 'Efficienza, riuso, monitoraggio e KPI ambientali.'],
              ['3', 'Digital MRV', 'Dati IoT, osservazioni, reporting e provenienza.'],
              ['4', 'Open Source', 'Repository, componenti e risultati indicizzati e riutilizzabili.'],
              ['5', 'Comuni & Pilot', 'Enti locali, orti, verde urbano e siti dimostrativi.'],
              ['6', 'Zorgax AI', 'Assistente pubblico per cittadini, tecnici e partner.'],
            ].map(([n, title, desc]) => <div key={n} style={box}><div style={{ color: '#67e8f9', fontSize: 12 }}>WP {n}</div><h3>{title}</h3><p style={{ color: '#9ca3af', lineHeight: 1.5 }}>{desc}</p></div>)}
          </div>
          <div style={{ ...box, marginTop: 14 }}>
            <h2>Flusso operativo</h2>
            <p style={{ color: '#b6c2d4', lineHeight: 1.7 }}>Registrazione soggetto → associazione a Comune/territorio → registrazione orto o sito pilota → raccolta dati e osservazioni → indicatori MRV → reporting pubblico → replicazione tramite repository open-source.</p>
          </div>
        </div>}

        {section === 'users' && <div style={box}>
          <h2>Registrazione cittadino / operatore</h2>
          <p style={{ color: '#a8b4c7' }}>L’indirizzo XMR è opzionale e pubblico. MyZubster non chiede seed phrase, chiavi private o password del wallet.</p>
          <form onSubmit={registerUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
            <input required placeholder="Username" value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} style={inputStyle}/>
            <input required type="email" placeholder="Email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} style={inputStyle}/>
            <input required minLength={6} type="password" placeholder="Password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} style={inputStyle}/>
            <input placeholder="Indirizzo XMR pubblico (opzionale)" value={userForm.moneroWallet} onChange={e => setUserForm({ ...userForm, moneroWallet: e.target.value.trim() })} style={inputStyle}/>
            <button style={buttonStyle}>Crea account</button>
          </form>
          {userStatus && <Status kind={userStatus.kind}>{userStatus.text}</Status>}
        </div>}

        {section === 'municipalities' && <div style={{ display: 'grid', gap: 14 }}>
          <div style={box}>
            <h2>Registro Comuni / Enti territoriali</h2>
            <form onSubmit={registerMunicipality} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
              {[
                ['name','Comune / Ente'], ['province','Provincia'], ['region','Regione'], ['pec','PEC'], ['contactEmail','Email referente'], ['website','Sito istituzionale'],
              ].map(([k,p]) => <input key={k} required={k === 'name'} placeholder={p} value={municipalityForm[k]} onChange={e => setMunicipalityForm({ ...municipalityForm, [k]: e.target.value })} style={inputStyle}/>)}
              <input placeholder="Note / pilot proposto" value={municipalityForm.notes} onChange={e => setMunicipalityForm({ ...municipalityForm, notes: e.target.value })} style={inputStyle}/>
              <button style={buttonStyle}>Registra ente</button>
            </form>
            {municipalityStatus && <Status kind={municipalityStatus.kind}>{municipalityStatus.text}</Status>}
          </div>
          <div style={box}>
            <h3>Enti registrati</h3>
            {!municipalities.length ? <p style={{ color: '#94a3b8' }}>Il registro è vuoto o il backend non è ancora raggiungibile dal dominio corrente.</p> : municipalities.map(m => <div key={m._id || m.id || m.name} style={{ padding: '10px 0', borderBottom: '1px solid #263247' }}><strong>{m.name}</strong> <span style={{ color: '#94a3b8' }}>{[m.province,m.region].filter(Boolean).join(' · ')}</span></div>)}
          </div>
        </div>}

        {section === 'gardens' && <div style={{ display: 'grid', gap: 14 }}>
          <div style={box}>
            <h2>Orti, verde urbano e siti pilota</h2>
            <p style={{ color: '#a8b4c7', lineHeight: 1.6 }}>Ogni sito deve poter essere collegato a un territorio, un responsabile, una baseline, attività operative e KPI: consumo idrico, riuso, manutenzione, materiali, rifiuti evitati e osservazioni ambientali.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
              {['Anagrafica sito','Coordinate & Comune','Sensori / dati IoT','Acqua e irrigazione','Materiali & circolarità','KPI / MRV','Foto e osservazioni','Report LIFE'].map(x => <div key={x} style={{ background: '#0b1220', padding: 12, borderRadius: 10, border: '1px solid #263247' }}>{x}</div>)}
            </div>
          </div>
          <div style={box}><h3>Gestione esistente</h3><p style={{ color: '#a8b4c7' }}>La piattaforma mantiene le API esistenti per <code>/api/gardens</code>, piante, mappa e dashboard pilot. Questa nuova area le organizza secondo il modello LIFE/MRV.</p></div>
        </div>}

        {section === 'repos' && <div style={box}>
          <h2>Indice repository MyZubster</h2>
          <p style={{ color: '#a8b4c7' }}>{repoStatus}. Ordinamento GitHub: aggiornati più di recente.</p>
          <input placeholder="Cerca repository, linguaggio, topic…" value={repoQuery} onChange={e => setRepoQuery(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }}/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 10 }}>
            {filteredRepos.map(r => <a key={r.id} href={r.html_url} target="_blank" rel="noreferrer" style={{ ...box, color: '#fff', textDecoration: 'none', padding: 14 }}>
              <div style={{ color: '#67e8f9', fontWeight: 800 }}>{r.name}</div>
              <p style={{ color: '#a8b4c7', minHeight: 38 }}>{r.description || 'Repository MyZubster'}</p>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{r.language || 'multi-language'} · ★ {r.stargazers_count} · aggiornato {new Date(r.updated_at).toLocaleDateString()}</div>
            </a>)}
          </div>
        </div>}

        {section === 'zorgax' && <div style={box}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div><h2 style={{ marginBottom: 6 }}>Zorgax AI per tutti</h2><p style={{ color: '#a8b4c7', marginTop: 0 }}>Accesso pubblico, senza account obbligatorio.</p></div>
            <a href={`${GATEWAY}/zargox`} target="_blank" rel="noreferrer" style={{ ...buttonStyle, textDecoration: 'none' }}>Apri a schermo intero</a>
          </div>
          <iframe title="Zorgax AI" src={`${GATEWAY}/zargox`} style={{ width: '100%', minHeight: 720, border: '1px solid #263247', borderRadius: 14, background: '#090b14' }}/>
        </div>}
      </div>
    </div>
  );
}

export default LifePortalPage;

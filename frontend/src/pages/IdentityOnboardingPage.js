import React, { useMemo, useState } from 'react';

const shell = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at top left, #24103d 0%, transparent 36%), radial-gradient(circle at bottom right, #063c45 0%, transparent 32%), #060914',
  color: '#f8fafc',
};

const card = {
  background: 'rgba(9, 18, 31, 0.92)',
  border: '1px solid #24364d',
  borderRadius: 22,
  padding: 20,
  boxShadow: '0 24px 80px rgba(0,0,0,.35)',
};

const input = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 12,
  border: '1px solid #334155',
  background: '#08111f',
  color: '#fff',
  fontSize: 16,
  boxSizing: 'border-box',
};

const primary = {
  border: 0,
  borderRadius: 12,
  padding: '13px 18px',
  background: 'linear-gradient(90deg,#a855f7,#ec4899)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  fontSize: 15,
};

const secondary = {
  ...primary,
  background: '#142235',
  border: '1px solid #31445d',
};

const archetypes = [
  { id: 'guardian', icon: '🛡️', label: 'Guardian', tone: 'privacy · trust · resilience', colors: ['#22d3ee', '#2563eb'] },
  { id: 'builder', icon: '⚙️', label: 'Builder', tone: 'open source · systems · creation', colors: ['#d946ef', '#7c3aed'] },
  { id: 'explorer', icon: '🛰️', label: 'Explorer', tone: 'curiosity · discovery · future', colors: ['#fb7185', '#8b5cf6'] },
  { id: 'caretaker', icon: '🌱', label: 'Caretaker', tone: 'community · environment · impact', colors: ['#34d399', '#0891b2'] },
];

function escapeXml(value) {
  return String(value).replace(/[<>&'\"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
}

function avatarDataUri(name, archetype, traits) {
  const initials = (name || 'Z').trim().split(/\s+/).map(v => v[0]).join('').slice(0, 2).toUpperCase() || 'Z';
  const [a, b] = archetype.colors;
  const trait = traits[0] || 'identity';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="512" height="512" rx="84" fill="#070b16"/>
    <circle cx="256" cy="215" r="150" fill="url(#g)" opacity=".24"/>
    <circle cx="256" cy="215" r="118" fill="none" stroke="url(#g)" stroke-width="8"/>
    <text x="256" y="250" text-anchor="middle" font-family="Arial,sans-serif" font-size="112" font-weight="800" fill="#fff">${escapeXml(initials)}</text>
    <text x="256" y="390" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="${a}">${escapeXml(archetype.label.toUpperCase())}</text>
    <text x="256" y="430" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" fill="#cbd5e1">#${escapeXml(trait.replace(/\s+/g, '-'))}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function IdentityOnboardingPage({ onContinue, onSkip }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [archetype, setArchetype] = useState(archetypes[1]);
  const [traits, setTraits] = useState('cyberpunk, developer, privacy');
  const [account, setAccount] = useState({ username: '', email: '', password: '' });
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const traitList = useMemo(() => traits.split(',').map(v => v.trim()).filter(Boolean).slice(0, 4), [traits]);
  const displayName = name.trim() || 'Your Zubster';
  const avatar = useMemo(() => avatarDataUri(displayName, archetype, traitList), [displayName, archetype, traitList]);

  function makeDraft(extra = {}) {
    return {
      name: displayName,
      archetype: archetype.label,
      archetypeId: archetype.id,
      traits: traitList,
      avatar,
      createdAt: new Date().toISOString(),
      ...extra,
    };
  }

  function persistAndContinue(draft) {
    localStorage.setItem('myzubster-identity-draft', JSON.stringify(draft));
    localStorage.setItem('myzubster-onboarding-seen', '1');
    onContinue?.(draft);
  }

  function goToAccount() {
    const suggested = displayName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
    setAccount(v => ({ ...v, username: v.username || suggested }));
    setStep(4);
  }

  async function registerAndSave(e) {
    e.preventDefault();
    setSaving(true);
    setStatus('Creazione account e identità…');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(account),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Registrazione non riuscita');
      if (data.data?.token) localStorage.setItem('myzubster-token', data.data.token);
      const draft = makeDraft({ accountLinked: true, username: account.username });
      persistAndContinue(draft);
      setStatus('Identità salvata e account creato.');
    } catch (error) {
      setStatus(error.message);
    } finally {
      setSaving(false);
    }
  }

  function saveLocalOnly() {
    persistAndContinue(makeDraft({ accountLinked: false }));
  }

  return (
    <div style={shell}>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '30px 16px 70px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
          <div style={{ fontWeight: 900, fontSize: 21 }}>🌍 MyZubster</div>
          <button onClick={onSkip} style={{ ...secondary, padding: '9px 13px' }}>Esplora senza creare</button>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 18, alignItems: 'stretch' }}>
          <div style={card}>
            <div style={{ color: '#67e8f9', fontSize: 12, fontWeight: 900, letterSpacing: 1.4 }}>IDENTITY ONBOARDING · {step}/4</div>
            <h1 style={{ fontSize: 'clamp(38px,7vw,68px)', lineHeight: 1, margin: '14px 0' }}>Chi vuoi essere su MyZubster?</h1>
            <p style={{ color: '#aebdca', fontSize: 18, lineHeight: 1.55, maxWidth: 620 }}>
              Prima crei qualcosa che ti rappresenta. Solo alla fine scegli se collegarlo a un account.
            </p>

            {step === 1 && <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
              <label style={{ fontWeight: 800 }}>Come vuoi chiamarti qui?</label>
              <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Nome, alias o callsign" maxLength={32} style={input} />
              <button onClick={() => setStep(2)} style={primary}>Continua →</button>
            </div>}

            {step === 2 && <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 800, marginBottom: 10 }}>Scegli un archetipo</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 10 }}>
                {archetypes.map(item => (
                  <button key={item.id} onClick={() => setArchetype(item)} style={{ ...card, padding: 14, cursor: 'pointer', textAlign: 'left', color: '#fff', borderColor: archetype.id === item.id ? '#d946ef' : '#24364d' }}>
                    <div style={{ fontSize: 28 }}>{item.icon}</div>
                    <strong>{item.label}</strong>
                    <div style={{ marginTop: 4, color: '#91a4b5', fontSize: 13 }}>{item.tone}</div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button onClick={() => setStep(1)} style={secondary}>← Indietro</button>
                <button onClick={() => setStep(3)} style={primary}>Continua →</button>
              </div>
            </div>}

            {step === 3 && <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
              <label style={{ fontWeight: 800 }}>Tre parole che ti rappresentano</label>
              <input value={traits} onChange={e => setTraits(e.target.value)} placeholder="cyberpunk, developer, privacy" style={input} />
              <small style={{ color: '#8fa4b3' }}>La preview e l’avatar cambiano subito. Puoi modificarli ancora prima di salvare.</small>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={() => setStep(2)} style={secondary}>← Indietro</button>
                <button onClick={goToAccount} style={primary}>Questa identità mi piace →</button>
              </div>
            </div>}

            {step === 4 && <form onSubmit={registerAndSave} style={{ marginTop: 24, display: 'grid', gap: 12 }}>
              <div>
                <strong>Salva la tua identità</strong>
                <div style={{ color: '#91a4b5', marginTop: 5 }}>Crea l’account adesso oppure continua con una bozza solo locale.</div>
              </div>
              <input required minLength={3} value={account.username} onChange={e => setAccount({ ...account, username: e.target.value })} placeholder="Username" style={input} />
              <input required type="email" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} placeholder="Email" style={input} />
              <input required minLength={6} type="password" value={account.password} onChange={e => setAccount({ ...account, password: e.target.value })} placeholder="Password (minimo 6 caratteri)" style={input} />
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => setStep(3)} style={secondary}>← Modifica</button>
                <button disabled={saving} style={{ ...primary, opacity: saving ? .65 : 1 }}>{saving ? 'Salvataggio…' : 'Crea account + salva identità'}</button>
                <button type="button" onClick={saveLocalOnly} style={secondary}>Solo bozza locale</button>
              </div>
              {status && <div style={{ color: status.includes('non riuscita') || status.includes('Errore') ? '#fca5a5' : '#fbbf24' }}>{status}</div>}
            </form>}
          </div>

          <aside style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 500, borderColor: '#3b2456' }}>
            <div>
              <div style={{ color: '#f0abfc', fontSize: 12, fontWeight: 900, letterSpacing: 1.4 }}>LIVE IDENTITY + AVATAR</div>
              <div style={{ marginTop: 22, borderRadius: 22, padding: 22, background: 'linear-gradient(145deg,#111827,#24103d 58%,#083344)', border: '1px solid #5b2c6f' }}>
                <img src={avatar} alt={`Avatar preview di ${displayName}`} style={{ width: 128, height: 128, borderRadius: 24, display: 'block', border: '1px solid rgba(255,255,255,.18)' }} />
                <h2 style={{ fontSize: 34, margin: '18px 0 4px' }}>{displayName}</h2>
                <div style={{ color: '#67e8f9', fontWeight: 800 }}>{archetype.label}</div>
                <p style={{ color: '#c2ced8', lineHeight: 1.55 }}>Una nuova identità MyZubster orientata a {archetype.tone.replaceAll(' · ', ', ')}.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
                  {(traitList.length ? traitList : ['identity', 'future']).map(trait => <span key={trait} style={{ padding: '7px 10px', borderRadius: 999, background: '#0b1d2a', border: '1px solid #27465c', color: '#bae6fd', fontSize: 13 }}>#{trait.replace(/\s+/g, '-')}</span>)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 22, color: '#91a4b5', lineHeight: 1.55, fontSize: 14 }}>
              <strong style={{ color: '#fff' }}>La preview nasce prima dell’account.</strong><br />
              L’avatar è generato localmente dai dati scelti; account e token vengono creati solo quando confermi la registrazione.
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default IdentityOnboardingPage;

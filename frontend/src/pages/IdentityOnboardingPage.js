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
  { id: 'guardian', icon: '🛡️', label: 'Guardian', tone: 'privacy · trust · resilience' },
  { id: 'builder', icon: '⚙️', label: 'Builder', tone: 'open source · systems · creation' },
  { id: 'explorer', icon: '🛰️', label: 'Explorer', tone: 'curiosity · discovery · future' },
  { id: 'caretaker', icon: '🌱', label: 'Caretaker', tone: 'community · environment · impact' },
];

function IdentityOnboardingPage({ onContinue, onSkip }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [archetype, setArchetype] = useState(archetypes[1]);
  const [traits, setTraits] = useState('cyberpunk, developer, privacy');

  const traitList = useMemo(() => traits.split(',').map(v => v.trim()).filter(Boolean).slice(0, 4), [traits]);
  const displayName = name.trim() || 'Your Zubster';

  function finish() {
    const draft = {
      name: displayName,
      archetype: archetype.label,
      traits: traitList,
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('myzubster-identity-draft', JSON.stringify(draft));
    localStorage.setItem('myzubster-onboarding-seen', '1');
    onContinue?.(draft);
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
            <div style={{ color: '#67e8f9', fontSize: 12, fontWeight: 900, letterSpacing: 1.4 }}>IDENTITY ONBOARDING · {step}/3</div>
            <h1 style={{ fontSize: 'clamp(38px,7vw,68px)', lineHeight: 1, margin: '14px 0' }}>Chi vuoi essere su MyZubster?</h1>
            <p style={{ color: '#aebdca', fontSize: 18, lineHeight: 1.55, maxWidth: 620 }}>
              Crea una prima identità in meno di un minuto. Nessun account richiesto finché non decidi di salvarla.
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
              <small style={{ color: '#8fa4b3' }}>Separale con una virgola. Le useremo per costruire tono e identità visiva.</small>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep(2)} style={secondary}>← Indietro</button>
                <button onClick={finish} style={primary}>Salva la mia identità</button>
              </div>
            </div>}
          </div>

          <aside style={{ ...card, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 500, borderColor: '#3b2456' }}>
            <div>
              <div style={{ color: '#f0abfc', fontSize: 12, fontWeight: 900, letterSpacing: 1.4 }}>LIVE PREVIEW</div>
              <div style={{ marginTop: 22, borderRadius: 22, padding: 22, background: 'linear-gradient(145deg,#111827,#24103d 58%,#083344)', border: '1px solid #5b2c6f' }}>
                <div style={{ width: 84, height: 84, borderRadius: 24, display: 'grid', placeItems: 'center', fontSize: 45, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.18)' }}>{archetype.icon}</div>
                <h2 style={{ fontSize: 34, margin: '18px 0 4px' }}>{displayName}</h2>
                <div style={{ color: '#67e8f9', fontWeight: 800 }}>{archetype.label}</div>
                <p style={{ color: '#c2ced8', lineHeight: 1.55 }}>Una nuova identità MyZubster orientata a {archetype.tone.replaceAll(' · ', ', ')}.</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 18 }}>
                  {(traitList.length ? traitList : ['identity', 'future']).map(trait => <span key={trait} style={{ padding: '7px 10px', borderRadius: 999, background: '#0b1d2a', border: '1px solid #27465c', color: '#bae6fd', fontSize: 13 }}>#{trait.replace(/\s+/g, '-')}</span>)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 22, color: '#91a4b5', lineHeight: 1.55, fontSize: 14 }}>
              <strong style={{ color: '#fff' }}>Prima il valore, poi l’account.</strong><br />
              Questa preview resta locale finché non scegli di continuare nel portale e registrarti.
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default IdentityOnboardingPage;

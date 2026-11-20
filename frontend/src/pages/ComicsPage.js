import React, { useState } from 'react';

const shellStyle = {
  minHeight: '100vh',
  background: 'radial-gradient(circle at 20% 0, #17264b, #070b16 52%, #03050b)',
  color: '#f6fbff',
  padding: '24px 16px 60px'
};

const wrapStyle = {
  maxWidth: 1200,
  margin: '0 auto'
};

const cardStyle = {
  background: 'rgba(11, 18, 32, 0.92)',
  border: '1px solid #263a57',
  borderRadius: 18,
  padding: 22
};

const badgeStyle = (type) => {
  const colors = {
    real: { color: '#70f0b0', border: '1px solid rgba(112, 240, 176, 0.4)', bg: 'rgba(112, 240, 176, 0.1)' },
    historical: { color: '#ffb8c0', border: '1px solid rgba(255, 184, 192, 0.4)', bg: 'rgba(255, 184, 192, 0.1)' },
    fiction: { color: '#ff85d8', border: '1px solid rgba(255, 133, 216, 0.4)', bg: 'rgba(255, 133, 216, 0.1)' },
    concept: { color: '#ffd166', border: '1px solid rgba(255, 209, 102, 0.4)', bg: 'rgba(255, 209, 102, 0.1)' }
  };
  const c = colors[type] || colors.real;
  return {
    display: 'inline-flex',
    padding: '3px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    marginRight: 6,
    color: c.color,
    border: c.border,
    background: c.bg
  };
};

const CHAPTERS = [
  { id: '1', title: 'Daniel // MyZubster: Origins', type: 'historical', desc: 'Le radici biografiche, l’osservazione del territorio e la nascita della visione aperta.' },
  { id: '2', title: 'Spiral Tribe ↔ Hakim Bey · Noel', type: 'historical', desc: 'Reti temporanee, controcultura e primi esperimenti di autonomia digitale.' },
  { id: '3', title: 'Space Station · Bot network', type: 'fiction', desc: 'La stazione orbitale narrativa dove operano gli agenti e il copilota Zorgax.' },
  { id: '4', title: 'Criptovalute & Trasparenza', type: 'real', desc: 'Distinzione netta tra trasparenza contabile on-chain e riservatezza individuale.' },
  { id: '5', title: 'Darkode · Reti chiuse', type: 'historical', desc: 'Riferimento storico alle reti chiuse, posto in contrasto con l’open evidence verificata.' },
  { id: '6', title: 'GitHub · Il founder firma in pubblico', type: 'real', desc: 'I commit, le issue e le pull request pubbliche come unica fonte di verità operativa.' },
  { id: '7', title: 'Territorio · Rimini entra nel racconto', type: 'real', desc: 'Fotografie territoriali reali da MyZubster-Photos integrate nel racconto visuale.' },
  { id: '8', title: 'Permacultura · Osservare il giardino', type: 'concept', desc: 'I cicli biologici, la rigenerazione del suolo e la biodiversità locale.' },
  { id: '9', title: 'Contributor · La comunità costruisce', type: 'real', desc: 'Contributor esterni che ampliano codice, test, visual e documentazione tecnica.' },
  { id: '10', title: 'Sentinel · Scope first', type: 'real', desc: 'Principio di verifica e sicurezza autorizzata: nessun test senza perimetro definito.' },
  { id: '11', title: 'Onion Underground · La città sotto la città', type: 'fiction', desc: 'Distretto narrativo privacy-first in cui la responsabilità resta primaria.' },
  { id: '12', title: 'Tre Chiavi · Il potere ha controlli', type: 'concept', desc: 'Modello di governance multi-chiave: Founder, Technical Council e Community.' },
  { id: '13', title: 'Rigenerazione · Ritorno al territorio', type: 'concept', desc: 'Ritorno ciclico alle osservazioni reali, ai giardini e alla misurazione di impatto.' }
];

export default function ComicsPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showChapters, setShowChapters] = useState(true);

  return (
    <div style={shellStyle}>
      <main style={wrapStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <a
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#55e8ff',
              textDecoration: 'none',
              fontWeight: 800,
              fontSize: 14,
              padding: '8px 14px',
              border: '1px solid #263a57',
              borderRadius: 10,
              background: '#0d1726'
            }}
          >
            ← Torna a MyZubster
          </a>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a
              href="/fumetto.html"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: 13,
                padding: '8px 14px',
                border: '1px solid #55e8ff',
                borderRadius: 10,
                background: 'rgba(85, 232, 255, 0.15)'
              }}
            >
              ↗ Apri lettore a schermo intero
            </a>
            <a
              href="https://github.com/MyZubster-Ecosystem/MyZubster-Photos"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#cbd5e1',
                textDecoration: 'none',
                fontWeight: 800,
                fontSize: 13,
                padding: '8px 14px',
                border: '1px solid #263a57',
                borderRadius: 10,
                background: '#0d1726'
              }}
            >
              🐙 Foto GitHub MyZubster-Photos
            </a>
          </div>
        </div>

        {/* Hero Section */}
        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(23, 42, 77, 0.95), rgba(22, 36, 25, 0.95))', marginBottom: 22 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#55e8ff', letterSpacing: '.12em', marginBottom: 6 }}>
            MYZUBSTER · COMIC UNIVERSE & NARRAZIONE VISIVA
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', margin: '0 0 10px', color: '#fff' }}>
            Fumetto Community & Galleria Live
          </h1>
          <p style={{ margin: '0 0 16px', color: '#cbd5e1', fontSize: 16, lineHeight: 1.6, maxWidth: 840 }}>
            La narrazione visuale di MyZubster esplora le origini, le sperimentazioni di autonomia digitale,
            la Space Station e le fotografie territoriali di Rimini. Le tavole combinano le illustrazioni di Daniel e Nicola
            con le immagini pubbliche del repository GitHub <strong>MyZubster-Photos</strong>.
          </p>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
            <span style={badgeStyle('real')}>REAL_EVIDENCE</span>
            <span style={badgeStyle('historical')}>HISTORICAL_REFERENCE</span>
            <span style={badgeStyle('fiction')}>FICTION</span>
            <span style={badgeStyle('concept')}>FUTURE_CONCEPT</span>
          </div>

          <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(85, 232, 255, 0.25)', fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>
            <strong style={{ color: '#55e8ff' }}>Trasparenza su Token & Opere:</strong> Le opere visuali e i personaggi del fumetto rispettano la paternità artistica di Daniel e Nicola. I token effettivamente mintati su Base Sepolia (ERC-721/1155) sono censiti con hash verificato e nettamente distinti dalle proposte narrative, dai concept o da opere sperimentali in lavorazione.
          </div>
        </div>

        {/* Embedded Interactive Reader */}
        <section style={{ ...cardStyle, padding: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #263a57', marginBottom: 12 }}>
            <strong style={{ fontSize: 14, color: '#55e8ff' }}>📖 LETTORE INTERATTIVO (Live Static Engine)</strong>
            <button
              type="button"
              onClick={() => setShowChapters(!showChapters)}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
            >
              {showChapters ? 'Nascondi indice capitoli ▲' : 'Mostra indice capitoli ▼'}
            </button>
          </div>

          <div style={{ position: 'relative', width: '100%', minHeight: 650, borderRadius: 12, overflow: 'hidden', background: '#050713' }}>
            {!iframeLoaded && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12, background: '#050713', zIndex: 1, padding: 20, textAlign: 'center' }}>
                <div style={{ fontSize: 32 }}>📖</div>
                <div style={{ fontSize: 15, color: '#55e8ff', fontWeight: 800 }}>Caricamento del lettore interattivo…</div>
                <p style={{ maxWidth: 460, fontSize: 13, color: '#94a3b8' }}>
                  Il lettore scarica in tempo reale l’indice fotografico di MyZubster-Photos da GitHub. Se preferisci, puoi aprire il lettore autonomo a schermo intero:
                </p>
                <a href="/fumetto.html" target="_blank" rel="noreferrer" style={{ display: 'inline-block', padding: '10px 18px', background: '#0284c7', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 800, fontSize: 14 }}>
                  Apri /fumetto.html autonomo →
                </a>
              </div>
            )}
            <iframe
              src="/fumetto.html"
              title="MyZubster Comic Universe Reader"
              onLoad={() => setIframeLoaded(true)}
              style={{
                width: '100%',
                height: 720,
                border: 'none',
                display: 'block'
              }}
            />
          </div>
        </section>

        {/* Verified Chapters Catalog & Fallback */}
        {showChapters && (
          <section style={cardStyle}>
            <div style={{ fontSize: 12, fontWeight: 900, color: '#55e8ff', letterSpacing: '.08em', marginBottom: 6 }}>
              INDICE VERIFICATO DEI CAPITOLI & PROVENIENZA
            </div>
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: 20 }}>
              13 Capitoli dell’Universo Narrativo MyZubster
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              {CHAPTERS.map(c => (
                <div
                  key={c.id}
                  style={{
                    padding: 16,
                    borderRadius: 14,
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(255, 255, 255, 0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: '#55e8ff' }}>Cap. {c.id}</span>
                    <span style={badgeStyle(c.type)}>{c.type.toUpperCase()}</span>
                  </div>
                  <strong style={{ fontSize: 15, color: '#fff', display: 'block', marginBottom: 6 }}>
                    {c.title}
                  </strong>
                  <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.45 }}>
                    {c.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

import React from 'react';

const REPO = 'https://github.com/MyZubster-Ecosystem/myzubster';
const VISUAL_REPO = 'https://github.com/MyZubster-Ecosystem/MyZubster-Visual';
const REAL_EVIDENCE = 'https://raw.githubusercontent.com/MyZubster-Ecosystem/MyZubster-Visual/main/assets/evidence/myzubster-fontanella-rimini.jpg';
const REAL_EVIDENCE_BLOB = `${VISUAL_REPO}/blob/main/assets/evidence/myzubster-fontanella-rimini.jpg`;

const shell = { minHeight: '100vh', background: '#061019', color: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' };
const wrap = { maxWidth: 1080, margin: '0 auto', padding: '0 18px' };
const card = { background: '#0d1b27', border: '1px solid #21384a', borderRadius: 18, padding: 20 };
const primary = { display: 'inline-block', textDecoration: 'none', borderRadius: 12, padding: '12px 16px', background: '#0ea5e9', color: '#fff', fontWeight: 800 };
const secondary = { ...primary, background: '#122737', border: '1px solid #315068' };

function SimpleHomePage({ onExplore }) {
  const steps = [
    ['1', 'Osserva', 'Una persona nota un problema, un bene urbano o qualcosa che può essere migliorato.'],
    ['2', 'Segnala', 'L’osservazione viene descritta con dati minimi e, quando possibile, evidence verificabile.'],
    ['3', 'Agisci', 'La community, un contributor o un soggetto competente può prendere in carico una missione.'],
    ['4', 'Verifica', 'Il risultato viene distinto da proposte, illustrazioni e claim non ancora provati.'],
    ['5', 'Impatto', 'Solo dopo la verifica il cambiamento entra nello stato pubblico del progetto.'],
  ];

  return (
    <div style={shell}>
      <header style={{ borderBottom: '1px solid #1f3342', background: '#08141d' }}>
        <div style={{ ...wrap, paddingTop: 14, paddingBottom: 14, display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <strong style={{ fontSize: 21 }}>🌍 MyZubster</strong>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={`${REPO}/blob/main/JOIN.md`} target="_blank" rel="noreferrer" style={secondary}>Partecipa</a>
            <button type="button" onClick={onExplore} style={{ ...primary, border: 0, cursor: 'pointer' }}>Esplora l’ecosistema →</button>
          </div>
        </div>
      </header>

      <main style={{ ...wrap, paddingTop: 44, paddingBottom: 72 }}>
        <section style={{ maxWidth: 900 }}>
          <div style={{ color: '#67e8f9', fontWeight: 900, fontSize: 13, letterSpacing: 1.2 }}>CAPISCI MYZUBSTER IN 30 SECONDI</div>
          <h1 style={{ fontSize: 'clamp(42px,7vw,76px)', lineHeight: 0.98, margin: '12px 0 18px' }}>Problemi reali → azioni verificabili.</h1>
          <p style={{ color: '#c0d0dc', fontSize: 20, lineHeight: 1.6, maxWidth: 820 }}>
            MyZubster è un progetto open source che collega osservazioni del mondo reale, persone che possono intervenire e prove del risultato. Il punto non è mostrare tutto l’ecosistema subito: prima rendiamo chiaro il percorso dal problema all’impatto.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
            <a href="#caso-reale" style={primary}>Guarda un caso reale ↓</a>
            <a href="/chronicle-universe.html" style={secondary}>Esplora il mondo visuale</a>
          </div>
        </section>

        <section style={{ marginTop: 50 }}>
          <div style={{ color: '#67e8f9', fontWeight: 900, fontSize: 13 }}>COME FUNZIONA CONCRETAMENTE</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 18px' }}>Un solo filo principale.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
            {steps.map(([n, title, text]) => (
              <div key={n} style={card}>
                <div style={{ color: '#67e8f9', fontWeight: 950 }}>{n}</div>
                <h3 style={{ margin: '8px 0', fontSize: 22 }}>{title}</h3>
                <div style={{ color: '#aabcc9', lineHeight: 1.55 }}>{text}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="caso-reale" style={{ marginTop: 56 }}>
          <div style={{ color: '#86efac', fontWeight: 900, fontSize: 13 }}>UN CASO REALE · RIMINI</div>
          <h2 style={{ fontSize: 34, margin: '8px 0 12px' }}>Prima l’evidence. Poi la storia.</h2>
          <p style={{ color: '#b9cad6', lineHeight: 1.65, maxWidth: 850 }}>
            Il repository visuale contiene una fotografia reale di osservazione a Rimini. La Chronicle di Porta Galliana racconta invece il flusso problema → segnalazione → intervento → risultato come illustrazione narrativa. MyZubster mantiene le due cose separate: una fotografia può essere evidence; un fumetto spiega il processo ma non prova da solo che un evento sia avvenuto.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16, marginTop: 18 }}>
            <article style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <img src={REAL_EVIDENCE} alt="Fotografia reale di una fontanella a Rimini archiviata nel repository evidence MyZubster-Visual" style={{ width: '100%', display: 'block', aspectRatio: '4 / 3', objectFit: 'cover', background: '#020609' }} />
              <div style={{ padding: 18 }}>
                <div style={{ color: '#86efac', fontWeight: 900, fontSize: 12 }}>REAL EVIDENCE REFERENCE</div>
                <h3 style={{ margin: '8px 0' }}>Osservazione reale a Rimini</h3>
                <p style={{ color: '#aabcc9', lineHeight: 1.55 }}>Il file è pubblico su GitHub con provenance ispezionabile. La presenza nel repository non sostituisce eventuali verifiche aggiuntive richieste dal workflow.</p>
                <a href={REAL_EVIDENCE_BLOB} target="_blank" rel="noreferrer" style={secondary}>Apri provenance GitHub ↗</a>
              </div>
            </article>
            <article style={card}>
              <div style={{ color: '#f0abfc', fontWeight: 900, fontSize: 12 }}>NARRATIVE ILLUSTRATION</div>
              <h3 style={{ margin: '8px 0', fontSize: 25 }}>Porta Galliana: il flusso semplice</h3>
              <div style={{ fontSize: 20, lineHeight: 1.8, color: '#e2e8f0', margin: '18px 0' }}>Problema → Segnalazione → Intervento → Risultato</div>
              <p style={{ color: '#aabcc9', lineHeight: 1.55 }}>La Chronicle rende intuitivo il modello operativo. È storytelling documentale e rimane separata dalla prova fotografica reale.</p>
              <a href="/fumetto" style={secondary}>Apri il fumetto →</a>
            </article>
          </div>
        </section>

        <section style={{ ...card, marginTop: 56, borderColor: '#28566b', background: 'linear-gradient(135deg,#0d2030,#11192c)' }}>
          <div style={{ color: '#67e8f9', fontWeight: 900, fontSize: 13 }}>SOLO ADESSO: L’ECOSISTEMA</div>
          <h2 style={{ fontSize: 32, margin: '8px 0 10px' }}>Zorgax, GitHub, robotica, LIFE, metaverso e gli altri moduli vengono dopo.</h2>
          <p style={{ color: '#b6c5d1', lineHeight: 1.65, maxWidth: 860 }}>Sono strumenti, percorsi e sperimentazioni collegati allo stesso nucleo. Non devono competere per l’attenzione del nuovo visitatore prima che abbia capito cosa fa MyZubster.</p>
          <button type="button" onClick={onExplore} style={{ ...primary, border: 0, cursor: 'pointer', marginTop: 8 }}>Esplora tutto l’ecosistema →</button>
        </section>

        <section style={{ marginTop: 28, color: '#7f95a4', lineHeight: 1.6, fontSize: 14 }}>
          <strong style={{ color: '#a8bac7' }}>Evidence boundary:</strong> osservazione ≠ intervento, illustrazione ≠ prova, merge ≠ deployment, reward interno ≠ pagamento esterno. Le dichiarazioni di stato devono restare verificabili.
        </section>
      </main>
    </div>
  );
}

export default SimpleHomePage;

import React from 'react';

const shell = { minHeight: '100vh', background: '#071018', color: '#f8fafc' };
const card = { background: '#0f1b27', border: '1px solid #213547', borderRadius: 18, padding: 18 };
const link = { display: 'inline-block', padding: '11px 15px', borderRadius: 11, background: '#0ea5e9', color: '#fff', fontWeight: 800, textDecoration: 'none' };
const outlineLink = { ...link, background: '#10202e', border: '1px solid #2d5266' };

const steps = [
  ['1', 'Osserva', 'Raccogli un’osservazione reale, pubblica o autorizzata: una foto, un luogo, una misura ambientale, un test o un contributo tecnico.'],
  ['2', 'Documenta', 'Aggiungi contesto, provenienza, timestamp, fonti e solo i dati necessari. Non pubblicare segreti, dati personali inutili o località sensibili.'],
  ['3', 'Collega', 'Associa il dato a una mappa, dataset, pilot, missione, bounty o repository MyZubster.'],
  ['4', 'Collabora', 'Usa GitHub, il sito e le entità AI per proporre codice, visual, documentazione, test o ricerca.'],
  ['5', 'Verifica', 'Review umana ed evidenze distinguono CANON, PROPOSED, FICTION, SIMULATION, IMPLEMENTED e VERIFIED.'],
  ['6', 'Pubblica', 'Solo gli output autorizzati e sanitizzati diventano pubblici, riutilizzabili o reportabili.'],
  ['7', 'Reward accounting', 'MYZ rappresenta contabilità interna delle ricompense. Non equivale automaticamente a un pagamento o settlement esterno.'],
];

const areas = [
  ['🧠', '16 entità AI', 'Scegli l’unità più adatta al problema. Ogni entità ha ruolo, missione, workflow e limiti evidence-first. Se il motore generativo non è disponibile, il sito mantiene una guida locale deterministica.', '/entities'],
  ['✨', 'Zorgax', 'Guida generale dell’ecosistema: aiuta a orientarsi, separare fatti verificati, inferenze e lore, e trovare il prossimo passo utile.', '/zorgax'],
  ['🌱', 'Osservazioni e pilot', 'Le aree operative collegano orti, piante, ambiente e pilot a dati e prove verificabili.', '/gardens'],
  ['🎯', 'Missioni e bounty', 'Le bounty descrivono deliverable e criteri di accettazione. Una issue o una PR non prova da sola accettazione, funding o pagamento.', '/entity-bounties'],
  ['💻', 'Open source', 'Repository, issue e pull request sono il luogo principale per costruire, revisionare e verificare il lavoro pubblico.', '/repositories'],
  ['💧', 'LIFE', 'Il gateway LIFE organizza acqua, circolarità, MRV e replicazione. Interesse, incontri o concept note non equivalgono a funding o partnership formalizzata.', '/life'],
];

function HowItWorksPage() {
  return (
    <div style={shell}>
      <header style={{ borderBottom: '1px solid #1f3342', background: '#09141e' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '14px 16px', display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="/" style={{ color: '#fff', fontWeight: 900, textDecoration: 'none', fontSize: 20 }}>🌍 MyZubster</a>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href="/entities" style={outlineLink}>Entità AI</a>
            <a href="/apps" style={outlineLink}>Scarica App</a>
            <a href="https://github.com/MyZubster-Ecosystem/myzubster" target="_blank" rel="noreferrer" style={link}>GitHub</a>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '36px 16px 64px' }}>
        <section>
          <div style={{ color: '#67e8f9', fontWeight: 800, letterSpacing: 1, fontSize: 13 }}>COME FUNZIONA MYZUBSTER</div>
          <h1 style={{ fontSize: 'clamp(36px,6vw,62px)', lineHeight: 1.03, margin: '10px 0 14px', maxWidth: 900 }}>Dal dato reale a un risultato verificabile.</h1>
          <p style={{ color: '#b6c5d1', fontSize: 18, lineHeight: 1.65, maxWidth: 900 }}>
            MyZubster è un ecosistema open source per raccogliere osservazioni autorizzate, organizzarle, collaborare e costruire evidenze verificabili. Il sito mette in collegamento persone, dati, repository, missioni, pilot e 16 entità AI specializzate senza confondere una proposta con un risultato già verificato.
          </p>
        </section>

        <section aria-labelledby="workflow-title" style={{ ...card, marginTop: 22 }}>
          <h2 id="workflow-title" style={{ marginTop: 0 }}>Il flusso in 7 passi</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 12 }}>
            {steps.map(([n, title, text]) => (
              <article key={n} style={{ padding: 15, background: '#091621', borderRadius: 12 }}>
                <strong style={{ color: '#67e8f9' }}>{n}. {title}</strong>
                <p style={{ color: '#a8bac7', lineHeight: 1.55, marginBottom: 0 }}>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="areas-title" style={{ marginTop: 26 }}>
          <h2 id="areas-title">Cosa trovi nel sito</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))', gap: 12 }}>
            {areas.map(([icon, title, text, href]) => (
              <article key={title} style={card}>
                <div aria-hidden="true" style={{ fontSize: 30 }}>{icon}</div>
                <h3 style={{ margin: '10px 0 6px' }}>{title}</h3>
                <p style={{ color: '#a8bac7', lineHeight: 1.55 }}>{text}</p>
                <a href={href} style={outlineLink}>Apri {title}</a>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="truth-title" style={{ ...card, marginTop: 26, borderColor: '#28566b' }}>
          <h2 id="truth-title" style={{ marginTop: 0 }}>Come leggere lo stato delle informazioni</h2>
          <p style={{ color: '#b6c5d1', lineHeight: 1.6 }}>
            MyZubster usa un approccio evidence-first. <strong>CANON</strong> indica una definizione approvata del progetto; <strong>PROPOSED</strong> una proposta non ancora approvata; <strong>FICTION</strong> contenuto narrativo; <strong>SIMULATION</strong> un risultato simulato; <strong>IMPLEMENTED</strong> qualcosa presente nel codice; <strong>VERIFIED</strong> qualcosa supportato dalle evidenze richieste. Queste etichette non devono essere intercambiabili.
          </p>
        </section>

        <section aria-labelledby="safe-title" style={{ ...card, marginTop: 16 }}>
          <h2 id="safe-title" style={{ marginTop: 0 }}>Cosa il sito non deve fingere</h2>
          <p style={{ color: '#b6c5d1', lineHeight: 1.6, marginBottom: 0 }}>
            Una PR non prova un deploy. Un CID non prova che un’affermazione sia vera. Una registrazione MYZ non prova un pagamento esterno. Una visual o un personaggio non prova identità, partnership o endorsement. Dati scientifici, impatti ambientali, funding e partnership richiedono sempre la relativa evidenza indipendente o ufficiale.
          </p>
        </section>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
          <a href="/entities" style={link}>Parla con le 16 entità</a>
          <a href="https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/COME_FUNZIONA.md" target="_blank" rel="noreferrer" style={outlineLink}>Documentazione tecnica</a>
          <a href="/" style={outlineLink}>Torna alla home</a>
        </div>
      </main>
    </div>
  );
}

export default HowItWorksPage;

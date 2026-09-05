import React, { useMemo, useState } from 'react';
import './ZorgaxLifePilotPage.css';

const API_BASE = '/api/zorgax/digital-business';

const NICOLA_PILOT_PROFILE = {
  displayName: 'Nicola',
  githubLogin: 'nicolaususnicola-lgtm',
  githubProfileUrl: 'https://github.com/nicolaususnicola-lgtm',
  githubRepository: 'nicolaususnicola-lgtm/Profilo',
  githubRepositoryUrl: 'https://github.com/nicolaususnicola-lgtm/Profilo'
};

const NICOLA_VALIDATION_UPDATE = {
  recordedAt: '2026-08-30',
  source: 'participant_relayed_interviews',
  scope: 'BOTH_CANDIDATES_UNATTRIBUTED',
  verdict: 'NEEDS_EVIDENCE',
  summary: 'Quattro riscontri preliminari mostrano interesse generale, utilità percepita e potenziale, ma non distinguono ancora le due idee.',
  evidence: [
    {
      participant: 'Persona A',
      finding: 'Le proposte sono interessanti, nuove per la persona e potrebbero funzionare.'
    },
    {
      participant: 'Persona B',
      finding: 'Le proposte sono percepite come nuove, utili e potenzialmente adatte al mercato.'
    },
    {
      participant: 'Persona C',
      finding: 'Le proposte sono considerate valide e con potenziale; è emerso interesse ad approfondirle.'
    },
    {
      participant: 'Persona D',
      finding: 'L’interesse è positivo; la presenza di concorrenti è vista come un possibile segnale di domanda.'
    }
  ],
  gaps: [
    'Nessuna preferenza esplicita tra le due idee.',
    'Nessuna descrizione completa del problema e della soluzione usata oggi.',
    'Nessuna conferma ancora raccolta su test, prezzo o disponibilità a pagare.'
  ],
  nextGate: 'Raccogliere almeno quattro risposte anonime che confrontino direttamente entrambe le idee.'
};

// The first responses cover both concepts together, so they are not copied into
// either candidate's evidence array until Nicola supplies attributable comparisons.
const DEFAULT_IDEAS = [
  {
    candidateId: 'kit-primo-prodotto-7-giorni',
    title: 'Kit “Primo prodotto digitale in 7 giorni”',
    description: 'Workbook, checklist ed esercizi per trasformare una prima idea in un prodotto testabile in sette giorni.',
    targetCustomer: 'Principiante che vuole preparare il primo prodotto digitale',
    customerProblem: 'Ha molte informazioni ma non un percorso operativo breve e verificabile',
    valueProposition: 'Un percorso di sette giorni per scegliere, validare e preparare un primo MVP',
    evidence: [],
    constraints: ['Non promettere vendite o profitto; mantenere la prima versione piccola'],
    participantInterest: 50,
    buildEase: 70
  },
  {
    candidateId: 'project-planner-ai',
    title: 'Project Planner per lavorare con AI',
    description: 'Planner guidato per definire obiettivi, attività, prompt, decisioni ed evidenze di un progetto svolto con AI.',
    targetCustomer: 'Creator o aspirante imprenditore che vuole organizzare un progetto con strumenti AI',
    customerProblem: 'Usa l’AI in modo frammentato e perde obiettivi, decisioni, attività ed evidenze',
    valueProposition: 'Un unico planner per trasformare conversazioni con l’AI in un progetto ordinato e misurabile',
    evidence: [],
    constraints: ['Validare il flusso con utenti reali prima di aggiungere automazioni'],
    participantInterest: 50,
    buildEase: 70
  }
];

function authHeaders() {
  const token = localStorage.getItem('myzubster-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success === false) throw new Error(data.message || `Errore ${response.status}`);
  return data;
}

function demoRanking(ideas) {
  const ranked = ideas.map((idea) => {
    const clarity = [idea.targetCustomer, idea.customerProblem, idea.valueProposition].filter(Boolean).length * 10;
    const evidence = Math.min((idea.evidence || []).filter(Boolean).length * 12, 36);
    const feasibility = Math.round((Number(idea.buildEase) || 50) * 0.18);
    const interest = Math.round((Number(idea.participantInterest) || 50) * 0.16);
    const penalty = Math.min((idea.constraints || []).filter(Boolean).length * 5, 20);
    const score = Math.max(0, Math.min(100, clarity + evidence + feasibility + interest - penalty));
    return {
      ...idea,
      score,
      recommendation: score >= 70 ? 'VALIDATE_FIRST' : score >= 45 ? 'COLLECT_MORE_EVIDENCE' : 'REFINE_OR_REPLACE'
    };
  }).sort((a, b) => b.score - a.score || a.candidateId.localeCompare(b.candidateId));
  return {
    version: 'zorgax_life_idea_ranking_v1',
    rankedCandidates: ranked.map((item, index) => ({ ...item, rank: index + 1 })),
    recommendedCandidateId: ranked[0]?.candidateId || null,
    selectionRequired: true,
    selectedCandidateId: null,
    advisoryOnly: true,
    requiresHumanApproval: true,
    predictsSales: false,
    predictsProfit: false
  };
}

const stages = ['Onboarding', 'Idee', 'Scelta', 'Validazione', 'MVP', 'Lancio', 'Misurazione'];

function ZorgaxLifePilotPage() {
  const token = localStorage.getItem('myzubster-token');
  const [mode, setMode] = useState(token ? 'live' : 'demo');
  const [objective, setObjective] = useState('Creare e testare il primo piccolo prodotto digitale seguendo un processo misurabile.');
  const [weeklyCommitment, setWeeklyCommitment] = useState('3–5 ore a settimana per 4 settimane');
  const [preferredProductType, setPreferredProductType] = useState('GUIDE');
  const [ideas, setIdeas] = useState(DEFAULT_IDEAS);
  const [ranking, setRanking] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [project, setProject] = useState(null);
  const [report, setReport] = useState(null);
  const [blueprint, setBlueprint] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('Sessione pronta. Zorgax propone, Nicola decide.');

  const selectedIdea = useMemo(() => ideas.find(item => item.candidateId === selectedId) || null, [ideas, selectedId]);
  const currentStage = workspace?.currentStage || (blueprint ? 'MVP' : report ? 'Validazione' : selectedId ? 'Scelta' : ranking ? 'Idee' : 'Onboarding');

  function updateIdea(index, field, value) {
    setIdeas(current => current.map((idea, i) => i === index ? { ...idea, [field]: value } : idea));
  }

  async function run(label, action) {
    setBusy(true);
    setMessage(label);
    try {
      const result = await action();
      setMessage('✓ Operazione completata. Nessuna pubblicazione o spesa automatica eseguita.');
      return result;
    } catch (error) {
      setMessage(`⚠ ${error.message}`);
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function startOnboarding() {
    if (mode === 'demo') {
      setMessage('✓ Demo onboarding pronta. In modalità live il consenso viene registrato sull’ownerId autenticato.');
      return;
    }
    await run('Registro invito, consenso e onboarding LIFE…', async () => {
      await api('/pilot/invitation', { method: 'POST', body: JSON.stringify({ metadata: { source: 'life-pilot-ui' } }) });
      await api('/pilot/accept', { method: 'POST', body: JSON.stringify({ accepted: true }) });
      await api('/pilot/onboarding', {
        method: 'PUT',
        body: JSON.stringify({ objective, weeklyCommitment, preferredProductType })
      });
    });
  }

  async function rankIdeas() {
    const result = await run('Zorgax sta confrontando le idee…', async () => {
      if (mode === 'demo') return { ranking: demoRanking(ideas) };
      return api('/pilot/ideas/rank', { method: 'POST', body: JSON.stringify({ ideas }) });
    });
    if (result?.ranking) setRanking(result.ranking);
  }

  async function createFirstProject() {
    if (!selectedIdea) {
      setMessage('⚠ Seleziona esplicitamente una delle idee prima di continuare.');
      return;
    }
    const result = await run('Creo il primo progetto dalla scelta umana…', async () => {
      if (mode === 'demo') {
        return {
          project: {
            projectId: 'demo-life-project',
            title: selectedIdea.title,
            description: selectedIdea.description,
            productType: preferredProductType,
            targetCustomer: selectedIdea.targetCustomer,
            customerProblem: selectedIdea.customerProblem,
            valueProposition: selectedIdea.valueProposition,
            status: 'IDEA'
          }
        };
      }
      return api('/pilot/first-project', {
        method: 'POST',
        body: JSON.stringify({
          title: selectedIdea.title,
          description: selectedIdea.description,
          productType: preferredProductType,
          targetCustomer: selectedIdea.targetCustomer,
          customerProblem: selectedIdea.customerProblem,
          valueProposition: selectedIdea.valueProposition,
          metadata: { humanSelectedCandidateId: selectedIdea.candidateId, rankingVersion: ranking?.version || null }
        })
      });
    });
    if (result?.project) setProject(result.project);
  }

  async function validateIdea() {
    if (!project) return setMessage('⚠ Prima crea il progetto dalla scelta umana.');
    const result = await run('Zorgax prepara una validazione evidence-based…', async () => {
      if (mode === 'demo') {
        return { report: { verdict: 'NEEDS_EVIDENCE', score: 58, experiments: ['Intervista 5 persone del target', 'Mostra una bozza del workbook e registra obiezioni', 'Testa una CTA con prezzo ipotetico senza incasso automatico'] } };
      }
      return api(`/projects/${project.projectId}/validate`, { method: 'POST', body: '{}' });
    });
    if (result?.report) setReport(result.report);
  }

  async function generateBlueprint() {
    if (!project) return setMessage('⚠ Prima crea il progetto.');
    const result = await run('Zorgax prepara il blueprint minimo…', async () => {
      if (mode === 'demo') {
        return { blueprint: { version: 'zorgax_digital_product_blueprint_v1', productDefinition: 'Workbook operativo + checklist', coreDeliverables: ['Scorecard 3 idee', 'Scheda cliente/problema/valore', 'Piano 3 esperimenti', 'Prima offerta', 'Dashboard risultati'], excludedScope: ['App complessa', 'Ads a pagamento', 'Automazioni commerciali', 'Community'] } };
      }
      return api(`/projects/${project.projectId}/blueprint`, { method: 'POST', body: '{}' });
    });
    if (result?.blueprint) setBlueprint(result.blueprint);
  }

  async function loadWorkspace() {
    if (!project) return setMessage('⚠ Prima crea il progetto.');
    const result = await run('Aggiorno il workspace LIFE…', async () => {
      if (mode === 'demo') {
        return { workspace: { currentStage: blueprint ? 'BLUEPRINT' : report ? 'VALIDATION' : 'STRATEGY', progress: { completedStages: blueprint ? 3 : report ? 2 : 1, totalStages: 6, percent: blueprint ? 50 : report ? 33 : 17 }, nextActions: blueprint ? ['Rivedere il blueprint con Nicola', 'Raccogliere evidenze prima del lancio'] : ['Raccogliere evidenze reali', 'Rivedere le ipotesi con Nicola'] } };
      }
      return api(`/projects/${project.projectId}/workspace`);
    });
    if (result?.workspace) setWorkspace(result.workspace);
  }

  const ranked = ranking?.rankedCandidates || ranking?.candidates || [];

  return (
    <main className="life-pilot-shell">
      <header className="life-hero">
        <div>
          <div className="life-kicker">MYZUBSTER · LIFE · ZORGAX</div>
          <h1>Digital Business Pilot</h1>
          <p>Una sessione guidata per trasformare un’idea in un piccolo prodotto testabile. Zorgax supporta ricerca e struttura; le decisioni restano umane.</p>
        </div>
        <div className="life-mode-card">
          <strong>{mode === 'live' ? 'Sessione autenticata' : 'Demo guidata'}</strong>
          <span>{mode === 'live' ? 'Le azioni usano le API pilot reali.' : 'Nessun dato viene scritto nel backend.'}</span>
          {token ? <button onClick={() => setMode(mode === 'live' ? 'demo' : 'live')}>Passa a {mode === 'live' ? 'demo' : 'live'}</button> : <a href="/social-login">Accedi per modalità live</a>}
        </div>
      </header>

      <section className="life-progress" aria-label="Percorso pilot">
        {stages.map((stage, index) => <div key={stage} className={`life-stage ${stage.toLowerCase() === String(currentStage).toLowerCase() ? 'active' : ''}`}><span>{index + 1}</span>{stage}</div>)}
      </section>

      <div className="life-status">{busy ? '⏳ ' : ''}{message}</div>

      <section className="life-grid">
        <article className="life-card life-card-wide">
          <div className="life-step">00 · PROFILO PILOTA</div>
          <h2>{NICOLA_PILOT_PROFILE.displayName} · identità GitHub</h2>
          <p className="life-muted">Questa scheda collega il profilo pubblico GitHub di Nicola al pilot LIFE. La verifica dell’identità MyZubster resta affidata al login e al flusso OAuth GitHub: il repository pubblico non sostituisce la verifica dell’account.</p>
          <div className="life-two-col">
            <div className="life-human-box">
              <strong>GitHub</strong>
              <span>@{NICOLA_PILOT_PROFILE.githubLogin}</span>
              <a href={NICOLA_PILOT_PROFILE.githubProfileUrl} target="_blank" rel="noreferrer">Apri profilo GitHub</a>
            </div>
            <div className="life-human-box">
              <strong>Repository profilo</strong>
              <span>{NICOLA_PILOT_PROFILE.githubRepository}</span>
              <a href={NICOLA_PILOT_PROFILE.githubRepositoryUrl} target="_blank" rel="noreferrer">Apri repository</a>
            </div>
          </div>
          <div className="life-human-box">
            <strong>Collegamento MyZubster</strong>
            <span>Il profilo pubblico è associato al partecipante Nicola nel pilot. Lo stato account-linked viene considerato verificato solo quando MyZubster riceve la stessa identità GitHub tramite OAuth autenticato.</span>
          </div>
        </article>

        <article className="life-card life-card-wide">
          <div className="life-step">01 · SESSIONE</div>
          <h2>Obiettivo personale</h2>
          <label>Obiettivo del pilot<textarea value={objective} onChange={e => setObjective(e.target.value)} /></label>
          <div className="life-two-col">
            <label>Tempo realistico<input value={weeklyCommitment} onChange={e => setWeeklyCommitment(e.target.value)} /></label>
            <label>Formato iniziale<select value={preferredProductType} onChange={e => setPreferredProductType(e.target.value)}><option value="GUIDE">Guida / workbook</option><option value="TEMPLATE">Template</option><option value="COURSE">Mini corso</option><option value="APP">App</option><option value="OTHER">Altro</option></select></label>
          </div>
          <button className="life-primary" disabled={busy} onClick={startOnboarding}>Conferma obiettivo della sessione</button>
        </article>

        <article className="life-card life-card-wide">
          <div className="life-step">02 · IDEE</div>
          <h2>Due idee da confrontare</h2>
          <p className="life-muted">Le due proposte attive derivano dalla scelta di Nicola. I primi feedback restano evidenza aggregata finché non saranno attribuibili a una singola idea.</p>
          <div className="life-result">
            <strong>Aggiornamento validazione · {NICOLA_VALIDATION_UPDATE.recordedAt}</strong>
            <span>Verdetto: {NICOLA_VALIDATION_UPDATE.verdict}</span>
            <p>{NICOLA_VALIDATION_UPDATE.summary}</p>
            <ul>
              {NICOLA_VALIDATION_UPDATE.evidence.map(item => <li key={item.participant}><strong>{item.participant}:</strong> {item.finding}</li>)}
            </ul>
            <strong>Limiti delle evidenze</strong>
            <ul>{NICOLA_VALIDATION_UPDATE.gaps.map(item => <li key={item}>{item}</li>)}</ul>
            <span><strong>Prossimo gate:</strong> {NICOLA_VALIDATION_UPDATE.nextGate}</span>
          </div>
          <div className="life-ideas">
            {ideas.map((idea, index) => (
              <div className="life-idea" key={idea.candidateId}>
                <div className="life-idea-number">{index + 1}</div>
                <input className="life-title-input" value={idea.title} onChange={e => updateIdea(index, 'title', e.target.value)} />
                <textarea value={idea.description} onChange={e => updateIdea(index, 'description', e.target.value)} />
                <label>Cliente<input value={idea.targetCustomer} onChange={e => updateIdea(index, 'targetCustomer', e.target.value)} /></label>
                <label>Problema<input value={idea.customerProblem} onChange={e => updateIdea(index, 'customerProblem', e.target.value)} /></label>
                <label>Valore<input value={idea.valueProposition} onChange={e => updateIdea(index, 'valueProposition', e.target.value)} /></label>
              </div>
            ))}
          </div>
          <button className="life-primary" disabled={busy} onClick={rankIdeas}>Chiedi a Zorgax di confrontarle</button>
        </article>

        {ranking && <article className="life-card life-card-wide">
          <div className="life-step">03 · DECISIONE</div>
          <h2>Suggerimento Zorgax ≠ decisione umana</h2>
          <div className="life-ranking">
            {ranked.map((item, index) => (
              <button key={item.candidateId} className={`life-rank-row ${selectedId === item.candidateId ? 'selected' : ''}`} onClick={() => setSelectedId(item.candidateId)}>
                <span className="life-rank">#{item.rank || index + 1}</span>
                <span><strong>{item.title}</strong><small>{item.recommendation}</small></span>
                <b>{item.score}/100</b>
              </button>
            ))}
          </div>
          <div className="life-human-box"><strong>Decisione di Nicola</strong><span>{selectedIdea ? `Selezionata: ${selectedIdea.title}` : 'Nessuna idea ancora selezionata.'}</span></div>
          <button className="life-primary" disabled={busy || !selectedIdea} onClick={createFirstProject}>Conferma scelta e crea il primo progetto</button>
        </article>}

        {project && <article className="life-card">
          <div className="life-step">04 · VALIDAZIONE</div>
          <h2>{project.title}</h2>
          <p>{project.targetCustomer}</p>
          <button className="life-primary" disabled={busy} onClick={validateIdea}>Prepara validazione</button>
          {report && <div className="life-result"><strong>Verdetto: {report.verdict}</strong>{report.score !== undefined && <span>Score {report.score}/100</span>}<ul>{(report.experiments || []).slice(0, 4).map(item => <li key={String(item)}>{typeof item === 'string' ? item : item.title || JSON.stringify(item)}</li>)}</ul></div>}
        </article>}

        {project && <article className="life-card">
          <div className="life-step">05 · MVP</div>
          <h2>Blueprint minimo</h2>
          <p className="life-muted">Si genera solo un piano. Nessuna pubblicazione automatica.</p>
          <button className="life-primary" disabled={busy || !report} onClick={generateBlueprint}>Genera blueprint</button>
          {blueprint && <div className="life-result"><strong>{blueprint.productDefinition || blueprint.product?.definition || 'Blueprint pronto'}</strong><ul>{(blueprint.coreDeliverables || blueprint.deliverables || []).slice(0, 5).map(item => <li key={String(item)}>{typeof item === 'string' ? item : item.title || item.name || JSON.stringify(item)}</li>)}</ul></div>}
        </article>}

        {project && <article className="life-card life-card-wide">
          <div className="life-step">06 · WORKSPACE</div>
          <h2>Stato della prima missione</h2>
          <button className="life-secondary" disabled={busy} onClick={loadWorkspace}>Aggiorna workspace</button>
          {workspace && <div className="life-workspace"><div><b>{workspace.progress?.percent ?? '—'}%</b><span>Progresso pilot</span></div><div><b>{workspace.currentStage || '—'}</b><span>Fase corrente</span></div><div className="life-next"><b>Prossime azioni</b>{(workspace.nextActions || []).map(item => <span key={item}>→ {item}</span>)}</div></div>}
        </article>}
      </section>

      <footer className="life-safety">
        <strong>Human approval by design</strong>
        <span>Nessuna pubblicazione automatica · Nessuna spesa automatica · Nessun messaggio commerciale automatico · Nessuna promessa di profitto</span>
      </footer>
    </main>
  );
}

export default ZorgaxLifePilotPage;

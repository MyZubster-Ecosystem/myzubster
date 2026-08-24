import React, { useEffect, useState } from 'react';
import { getEntityBounties as fetchEntityBounties } from '../api/entities';
import { getEntityBountyBundle } from '../data/entityBounties';
import './EntityBountyPanel.css';

const STATE_LABELS = {
  COMPLETE: 'Completato',
  IN_REVIEW: 'In revisione',
  OPEN: 'Da completare',
  OPEN_FOR_PROPOSAL: 'Aperta a proposte'
};

function VisualFormats({ entity }) {
  return (
    <div className="entity-visual-formats" aria-label="Formati visuali richiesti">
      <span className="entity-visual-format entity-visual-format--avatar">{entity.icon}<small>1:1</small></span>
      <span className="entity-visual-format entity-visual-format--hero" style={{ '--preview-accent': entity.accent }}><b>{entity.displayName}</b><small>16:9</small></span>
      <span className="entity-visual-format entity-visual-format--badge">{entity.icon}<small>SVG</small></span>
    </div>
  );
}

export default function EntityBountyPanel({ entity }) {
  const [bundle, setBundle] = useState(() => getEntityBountyBundle(entity));
  const [source, setSource] = useState('bundled');

  useEffect(() => {
    let active = true;
    setBundle(getEntityBountyBundle(entity));
    setSource('bundled');

    fetchEntityBounties(entity.slug)
      .then(data => {
        if (!active) return;
        setBundle(data);
        setSource('live');
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [entity]);

  const { completion, summary, bounties, policy } = bundle;

  return (
    <div className="entity-bounty-panel" aria-live="polite">
      <section className="entity-bounty-overview">
        <div
          className="entity-progress-ring"
          style={{ '--completion': `${completion.percent * 3.6}deg`, '--progress-accent': entity.accent }}
          role="progressbar"
          aria-label={`Completamento ${entity.displayName}`}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={completion.percent}
        >
          <strong>{completion.percent}%</strong>
          <small>pronta</small>
        </div>
        <div className="entity-bounty-overview-copy">
          <span className="entity-bounty-kicker">ENTITY COMPLETION BOARD</span>
          <h3>Completiamo {entity.displayName}</h3>
          <p>Due percorsi separano il lavoro operativo dal visual kit. Ogni consegna richiede prove revisionabili prima di qualsiasi registrazione MYZ.</p>
          <div className="entity-bounty-stats">
            <span><strong>{summary.bountyCount}</strong> bounty</span>
            <span><strong>{summary.proposedMYZ}</strong> MYZ proposti</span>
            <span><strong>{completion.complete}/{completion.total}</strong> milestone complete</span>
          </div>
        </div>
        <span className={`entity-bounty-source entity-bounty-source--${source}`}>{source === 'live' ? 'API sincronizzata' : 'Registro integrato'}</span>
      </section>

      <section className="entity-milestones" aria-label="Milestone di completamento">
        {completion.milestones.map((milestone, index) => (
          <article className={`entity-milestone entity-milestone--${milestone.state.toLowerCase().replace('_', '-')}`} key={milestone.id}>
            <span className="entity-milestone-index">{milestone.state === 'COMPLETE' ? '✓' : index + 1}</span>
            <div><strong>{milestone.label}</strong><small>{STATE_LABELS[milestone.state]}</small></div>
            <p>{milestone.description}</p>
          </article>
        ))}
      </section>

      <section className="entity-bounty-grid" aria-label={`Bounty per ${entity.displayName}`}>
        {bounties.map(bounty => (
          <article className={`entity-bounty-card entity-bounty-card--${bounty.track}`} key={bounty.id}>
            <header>
              <span className="entity-bounty-track-icon" aria-hidden="true">{bounty.trackIcon}</span>
              <div><small>{bounty.id}</small><h4>{bounty.trackLabel}</h4></div>
              <span className="entity-bounty-state">{STATE_LABELS[bounty.status] || bounty.status}</span>
            </header>

            {bounty.track === 'visual-identity' && <VisualFormats entity={entity} />}

            <p>{bounty.description}</p>
            <div className="entity-bounty-reward"><strong>{bounty.reward.amount} MYZ</strong><span>reward interno · {bounty.reward.fundingState.toLowerCase()}</span></div>

            <div className="entity-bounty-checklist">
              <strong>Deliverable</strong>
              <ul>{bounty.deliverables.map(item => <li key={item}>{item}</li>)}</ul>
            </div>

            <details>
              <summary>Criteri ed evidenze</summary>
              <strong>Criteri di accettazione</strong>
              <ul>{bounty.acceptanceCriteria.map(item => <li key={item}>{item}</li>)}</ul>
              <strong>Evidenze richieste</strong>
              <ul>{bounty.evidenceRequired.map(item => <li key={item}>{item}</li>)}</ul>
            </details>

            <a className="entity-bounty-propose" href={bounty.proposalUrl} target="_blank" rel="noreferrer">Proponi su GitHub ↗</a>
          </article>
        ))}
      </section>

      <footer className="entity-bounty-policy">
        <strong>Regola bounty</strong>
        <span>MYZ è contabilità interna. La proposta non assegna il lavoro e non promette un pagamento esterno.</span>
        <span>{policy.minimumIndependentReviewers} reviewer indipendente + approvazione maintainer.</span>
      </footer>
    </div>
  );
}

import program from './entityBountyProgram.json';

const STATE_WEIGHTS = {
  COMPLETE: 1,
  IN_REVIEW: 0.5,
  OPEN: 0
};

function milestoneState(slug, milestoneId) {
  return program.entityOverrides?.[slug]?.milestones?.[milestoneId]
    || program.defaultMilestoneStates[milestoneId]
    || 'OPEN';
}

function trackState(slug, trackId) {
  return program.entityOverrides?.[slug]?.tracks?.[trackId] || 'OPEN_FOR_PROPOSAL';
}

function issueBody(entity, track, bountyId) {
  return [
    `## Bounty ${bountyId}`,
    '',
    `**Entità:** ${entity.displayName} (${entity.id})`,
    `**Track:** ${track.label}`,
    `**Reward proposto:** ${track.rewardMYZ} MYZ (contabilità interna; non è una promessa di pagamento esterno)`,
    '',
    '### Deliverable',
    ...track.deliverables.map(item => `- [ ] ${item}`),
    '',
    '### Criteri di accettazione',
    ...track.acceptanceCriteria.map(item => `- [ ] ${item}`),
    '',
    '### Evidenze',
    ...track.evidenceRequired.map(item => `- [ ] ${item}`),
    '',
    '### Confini dell’entità',
    ...entity.boundaries.map(item => `- ${item}`),
    '',
    '> L’apertura di questa issue non assegna automaticamente il lavoro o la ricompensa. Servono revisione indipendente e approvazione del maintainer.'
  ].join('\n');
}

function proposalUrl(entity, track, bountyId) {
  const title = `[BOUNTY · MYZ PROPOSED] ${track.label} — ${entity.displayName}`;
  const query = `title=${encodeURIComponent(title)}&body=${encodeURIComponent(issueBody(entity, track, bountyId))}`;
  return `${entity.repository.url}/issues/new?${query}`;
}

export function getEntityCompletion(entity) {
  const milestones = program.milestones.map(milestone => ({
    ...milestone,
    state: milestoneState(entity.slug, milestone.id)
  }));
  const score = milestones.reduce((total, milestone) => total + (STATE_WEIGHTS[milestone.state] || 0), 0);
  const complete = milestones.filter(milestone => milestone.state === 'COMPLETE').length;
  const inReview = milestones.filter(milestone => milestone.state === 'IN_REVIEW').length;

  return {
    percent: Math.round((score / milestones.length) * 100),
    complete,
    inReview,
    total: milestones.length,
    milestones
  };
}

export function getEntityBounties(entity) {
  return program.tracks.map(track => {
    const id = `MYZ-${track.code}-${entity.id}`;
    return {
      id,
      entityId: entity.id,
      entitySlug: entity.slug,
      entityName: entity.displayName,
      entityIcon: entity.icon,
      entityAccent: entity.accent,
      repository: entity.repository,
      track: track.id,
      trackLabel: track.label,
      trackIcon: track.icon,
      title: `${track.label}: ${entity.displayName}`,
      description: track.description,
      status: trackState(entity.slug, track.id),
      reward: {
        asset: program.policy.rewardAsset,
        amount: track.rewardMYZ,
        kind: program.policy.rewardKind,
        fundingState: program.policy.fundingState
      },
      deliverables: track.deliverables,
      acceptanceCriteria: track.acceptanceCriteria,
      evidenceRequired: track.evidenceRequired,
      proposalUrl: proposalUrl(entity, track, id)
    };
  });
}

export function getEntityBountyBundle(entity) {
  const bounties = getEntityBounties(entity);
  return {
    ok: true,
    schemaVersion: program.schemaVersion,
    updatedAt: program.updatedAt,
    program: program.program,
    policy: program.policy,
    entity: {
      id: entity.id,
      slug: entity.slug,
      displayName: entity.displayName,
      icon: entity.icon,
      accent: entity.accent,
      repository: entity.repository
    },
    completion: getEntityCompletion(entity),
    summary: {
      bountyCount: bounties.length,
      proposedMYZ: bounties.reduce((total, bounty) => total + bounty.reward.amount, 0)
    },
    bounties
  };
}

export function getProgramSummary(entities) {
  const bundles = entities.map(getEntityBountyBundle);
  const bountyCount = bundles.reduce((total, bundle) => total + bundle.summary.bountyCount, 0);
  const proposedMYZ = bundles.reduce((total, bundle) => total + bundle.summary.proposedMYZ, 0);
  const averageCompletion = Math.round(
    bundles.reduce((total, bundle) => total + bundle.completion.percent, 0) / Math.max(bundles.length, 1)
  );

  return {
    entityCount: entities.length,
    bountyCount,
    proposedMYZ,
    averageCompletion
  };
}

export { program as entityBountyProgram };

const crypto = require('crypto');
const registry = require('../../frontend/src/data/daoGovernance.json');

const BALLOT_CHOICES = ['for', 'against', 'abstain'];
const DELEGATION_ACTIONS = ['delegate', 'revoke'];
const MAX_REASON_LENGTH = 500;
const MAX_KEY_LENGTH = 512;
const REPOSITORY_ISSUES_URL = `${registry.network.canonicalRepository}/issues/new`;

class DaoValidationError extends Error {
  constructor(message, statusCode = 400, code = 'INVALID_DAO_ARTIFACT') {
    super(message);
    this.name = 'DaoValidationError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function publicKeyBuffer(publicKeySpki) {
  if (typeof publicKeySpki !== 'string' || !publicKeySpki || publicKeySpki.length > MAX_KEY_LENGTH) {
    throw new DaoValidationError('Chiave pubblica Ed25519 non valida', 400, 'INVALID_PUBLIC_KEY');
  }

  try {
    const buffer = Buffer.from(publicKeySpki, 'base64');
    if (!buffer.length || buffer.toString('base64') !== publicKeySpki.replace(/\s/g, '')) throw new Error('base64');
    return buffer;
  } catch (_error) {
    throw new DaoValidationError('Chiave pubblica Ed25519 non valida', 400, 'INVALID_PUBLIC_KEY');
  }
}

function didFromPublicKey(publicKeySpki) {
  const digest = crypto.createHash('sha256').update(publicKeyBuffer(publicKeySpki)).digest('hex');
  return `did:myz:${digest}`;
}

function proposalDigest(proposal) {
  return sha256(stableStringify(proposal));
}

function getProposal(proposalId) {
  return registry.proposals.find((proposal) => proposal.id === proposalId) || null;
}

function normalizeBallotPayload(payload = {}) {
  return {
    schemaVersion: String(payload.schemaVersion || ''),
    networkId: String(payload.networkId || ''),
    proposalId: String(payload.proposalId || ''),
    proposalDigest: String(payload.proposalDigest || ''),
    voterDid: String(payload.voterDid || ''),
    publicKeySpki: String(payload.publicKeySpki || ''),
    choice: String(payload.choice || ''),
    reason: String(payload.reason || '').trim(),
    nonce: String(payload.nonce || ''),
    issuedAt: String(payload.issuedAt || '')
  };
}

function normalizeDelegationPayload(payload = {}) {
  return {
    schemaVersion: String(payload.schemaVersion || ''),
    networkId: String(payload.networkId || ''),
    action: String(payload.action || ''),
    delegatorDid: String(payload.delegatorDid || ''),
    publicKeySpki: String(payload.publicKeySpki || ''),
    delegateDid: String(payload.delegateDid || ''),
    scope: String(payload.scope || ''),
    nonce: String(payload.nonce || ''),
    issuedAt: String(payload.issuedAt || ''),
    expiresAt: String(payload.expiresAt || '')
  };
}

function validateCommonSignedPayload(payload, didField, now = new Date()) {
  if (payload.schemaVersion !== registry.schemaVersion) {
    throw new DaoValidationError('Versione schema non supportata', 400, 'UNSUPPORTED_SCHEMA');
  }
  if (payload.networkId !== registry.network.id) {
    throw new DaoValidationError('Network DAO non valida', 400, 'WRONG_NETWORK');
  }
  if (!/^[a-f0-9]{32}$/i.test(payload.nonce)) {
    throw new DaoValidationError('Nonce non valido', 400, 'INVALID_NONCE');
  }

  const issuedAt = new Date(payload.issuedAt);
  if (!Number.isFinite(issuedAt.getTime())) {
    throw new DaoValidationError('Data di firma non valida', 400, 'INVALID_ISSUED_AT');
  }
  if (issuedAt.getTime() > now.getTime() + 5 * 60 * 1000) {
    throw new DaoValidationError('La data di firma è nel futuro', 400, 'FUTURE_ISSUED_AT');
  }

  const expectedDid = didFromPublicKey(payload.publicKeySpki);
  if (payload[didField] !== expectedDid) {
    throw new DaoValidationError('DID e chiave pubblica non corrispondono', 400, 'DID_KEY_MISMATCH');
  }

  return issuedAt;
}

function verifyEd25519(payload, signature, publicKeySpki) {
  if (typeof signature !== 'string' || signature.length > 256 || !signature) {
    throw new DaoValidationError('Firma Ed25519 mancante o non valida', 400, 'INVALID_SIGNATURE');
  }

  try {
    const key = crypto.createPublicKey({ key: publicKeyBuffer(publicKeySpki), format: 'der', type: 'spki' });
    if (key.asymmetricKeyType !== 'ed25519') throw new Error('not-ed25519');
    const valid = crypto.verify(null, Buffer.from(stableStringify(payload)), key, Buffer.from(signature, 'base64'));
    if (!valid) throw new Error('bad-signature');
  } catch (_error) {
    throw new DaoValidationError('Firma Ed25519 non verificabile', 400, 'SIGNATURE_VERIFICATION_FAILED');
  }
}

function memberFor(did, publicKeySpki) {
  return registry.members.find((member) => (
    member.did === did
    && member.publicKeySpki === publicKeySpki
    && member.status === 'active'
    && member.kind !== 'ai'
  )) || null;
}

function chambersFor(member) {
  if (!member) return [];
  const allowed = new Set(registry.constitution.chambers.map((chamber) => chamber.id));
  return (member.chambers || []).filter((chamber) => allowed.has(chamber));
}

function buildIssueUrl(title, body, labels) {
  const params = new URLSearchParams({ title, body });
  if (labels) params.set('labels', labels);
  return `${REPOSITORY_ISSUES_URL}?${params.toString()}`;
}

function membershipRequestUrl(identity) {
  const body = [
    '## Richiesta di ammissione DAO',
    '',
    `**DID:** \`${identity.voterDid}\``,
    `**Chiave Ed25519 SPKI (base64):** \`${identity.publicKeySpki}\``,
    '',
    '- [ ] Ho pubblicato una prova di controllo della chiave',
    '- [ ] Ho dichiarato eventuali conflitti di interesse',
    '- [ ] Due reviewer indipendenti hanno verificato la richiesta',
    '',
    '> La richiesta non attribuisce peso di voto finché una pull request non aggiorna il registro canonico.'
  ].join('\n');
  return buildIssueUrl(`[DAO MEMBERSHIP] ${identity.voterDid.slice(0, 24)}…`, body, 'dao,membership');
}

function ballotSubmissionUrl(receipt) {
  const body = [
    `## Scheda firmata ${receipt.payload.proposalId}`,
    '',
    `**DID:** \`${receipt.payload.voterDid}\``,
    `**Scelta:** \`${receipt.payload.choice}\``,
    `**Receipt:** \`${receipt.receiptDigest}\``,
    `**Conteggiata:** ${receipt.counted ? 'sì' : 'no — osservatore non ammesso'}`,
    '',
    '```json',
    JSON.stringify({ payload: receipt.payload, signature: receipt.signature }, null, 2),
    '```',
    '',
    '> La scheda diventa canonica solo dopo verifica automatica e merge nel ledger Git.'
  ].join('\n');
  return buildIssueUrl(`[DAO BALLOT] ${receipt.payload.proposalId} · ${receipt.payload.voterDid.slice(0, 24)}…`, body, 'dao,ballot');
}

function delegationSubmissionUrl(receipt) {
  const body = [
    `## Delega firmata ${receipt.payload.scope}`,
    '',
    `**Delegante:** \`${receipt.payload.delegatorDid}\``,
    `**Delegato:** \`${receipt.payload.delegateDid}\``,
    `**Azione:** \`${receipt.payload.action}\``,
    `**Receipt:** \`${receipt.receiptDigest}\``,
    '',
    '```json',
    JSON.stringify({ payload: receipt.payload, signature: receipt.signature }, null, 2),
    '```',
    '',
    '> La delega diventa canonica solo dopo verifica automatica e merge nel ledger Git.'
  ].join('\n');
  return buildIssueUrl(`[DAO DELEGATION] ${receipt.payload.scope} · ${receipt.payload.delegatorDid.slice(0, 24)}…`, body, 'dao,delegation');
}

function verifyBallotEnvelope(envelope = {}, options = {}) {
  const payload = normalizeBallotPayload(envelope.payload);
  const proposal = getProposal(payload.proposalId);
  if (!proposal) throw new DaoValidationError('Proposta DAO non trovata', 404, 'PROPOSAL_NOT_FOUND');
  if (!BALLOT_CHOICES.includes(payload.choice)) {
    throw new DaoValidationError('Scelta non valida: usare for, against o abstain', 400, 'INVALID_CHOICE');
  }
  if (payload.reason.length > MAX_REASON_LENGTH) {
    throw new DaoValidationError(`Motivazione troppo lunga (massimo ${MAX_REASON_LENGTH} caratteri)`, 400, 'REASON_TOO_LONG');
  }

  const issuedAt = validateCommonSignedPayload(payload, 'voterDid', options.now || new Date());
  if (payload.proposalDigest !== proposalDigest(proposal)) {
    throw new DaoValidationError('Digest della proposta non corrispondente', 409, 'PROPOSAL_DIGEST_MISMATCH');
  }
  if (issuedAt < new Date(proposal.opensAt) || issuedAt > new Date(proposal.closesAt)) {
    throw new DaoValidationError('La scheda è stata firmata fuori dalla finestra di voto', 409, 'VOTING_WINDOW_CLOSED');
  }
  if (payload.voterDid.startsWith('entity:') || payload.voterDid.startsWith('ai:')) {
    throw new DaoValidationError('Le entità AI non hanno peso di voto vincolante', 403, 'AI_ACTOR_NOT_ELIGIBLE');
  }

  verifyEd25519(payload, envelope.signature, payload.publicKeySpki);
  const member = memberFor(payload.voterDid, payload.publicKeySpki);
  const chambers = chambersFor(member);
  const payloadDigest = sha256(stableStringify(payload));
  const receiptDigest = sha256(stableStringify({ payloadDigest, signature: envelope.signature }));

  const receipt = {
    verified: true,
    canonical: false,
    counted: chambers.length > 0,
    eligibility: chambers.length ? 'member' : 'observer',
    chambers,
    payload,
    signature: envelope.signature,
    payloadDigest,
    receiptDigest,
    verification: {
      algorithm: 'Ed25519',
      verifiedAt: new Date().toISOString(),
      sourceOfTruth: registry.network.ledgerPath,
      automaticExecution: false
    }
  };

  return {
    ...receipt,
    submissionUrl: ballotSubmissionUrl(receipt),
    membershipRequestUrl: member ? null : membershipRequestUrl(payload)
  };
}

function verifyDelegationEnvelope(envelope = {}, options = {}) {
  const payload = normalizeDelegationPayload(envelope.payload);
  if (!DELEGATION_ACTIONS.includes(payload.action)) {
    throw new DaoValidationError('Azione delega non valida', 400, 'INVALID_DELEGATION_ACTION');
  }
  if (!payload.delegateDid.startsWith('did:myz:')) {
    throw new DaoValidationError('DID del delegato non valido', 400, 'INVALID_DELEGATE');
  }
  if (!['all', ...registry.proposals.map((proposal) => `proposal:${proposal.id}`)].includes(payload.scope)) {
    throw new DaoValidationError('Ambito delega non valido', 400, 'INVALID_DELEGATION_SCOPE');
  }
  if (payload.delegatorDid === payload.delegateDid) {
    throw new DaoValidationError('Non puoi delegare a te stesso', 400, 'SELF_DELEGATION');
  }

  const issuedAt = validateCommonSignedPayload(payload, 'delegatorDid', options.now || new Date());
  const expiresAt = new Date(payload.expiresAt);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= issuedAt) {
    throw new DaoValidationError('Scadenza delega non valida', 400, 'INVALID_DELEGATION_EXPIRY');
  }
  verifyEd25519(payload, envelope.signature, payload.publicKeySpki);

  const member = memberFor(payload.delegatorDid, payload.publicKeySpki);
  const payloadDigest = sha256(stableStringify(payload));
  const receiptDigest = sha256(stableStringify({ payloadDigest, signature: envelope.signature }));
  const receipt = {
    verified: true,
    canonical: false,
    counted: Boolean(member),
    eligibility: member ? 'member' : 'observer',
    chambers: chambersFor(member),
    payload,
    signature: envelope.signature,
    payloadDigest,
    receiptDigest,
    verification: {
      algorithm: 'Ed25519',
      verifiedAt: new Date().toISOString(),
      maxDelegationDepth: registry.constitution.delegationMaxDepth,
      sourceOfTruth: registry.network.ledgerPath
    }
  };
  return { ...receipt, submissionUrl: delegationSubmissionUrl(receipt) };
}

function emptyChamberTally(chamber) {
  return {
    id: chamber.id,
    label: chamber.label,
    quorum: chamber.quorum,
    for: 0,
    against: 0,
    abstain: 0,
    participation: 0,
    quorumReached: false,
    approvalBps: 0,
    approved: false
  };
}

function tallyProposal(proposal) {
  const chamberTallies = Object.fromEntries(
    registry.constitution.chambers.map((chamber) => [chamber.id, emptyChamberTally(chamber)])
  );
  const seen = new Set();
  const invalidBallots = [];

  for (const envelope of registry.ballots) {
    if (envelope?.payload?.proposalId !== proposal.id) continue;
    try {
      const receipt = verifyBallotEnvelope(envelope);
      if (!receipt.counted || seen.has(receipt.payload.voterDid)) continue;
      seen.add(receipt.payload.voterDid);
      for (const chamber of receipt.chambers) {
        const tally = chamberTallies[chamber];
        if (tally) tally[receipt.payload.choice] += 1;
      }
    } catch (error) {
      invalidBallots.push({ receiptDigest: envelope.receiptDigest || null, code: error.code || 'INVALID' });
    }
  }

  for (const tally of Object.values(chamberTallies)) {
    tally.participation = tally.for + tally.against + tally.abstain;
    tally.quorumReached = tally.participation >= tally.quorum;
    const decisive = tally.for + tally.against;
    tally.approvalBps = decisive ? Math.round((tally.for / decisive) * 10000) : 0;
    tally.approved = tally.quorumReached && tally.approvalBps >= proposal.approvalThresholdBps;
  }

  return {
    chambers: Object.values(chamberTallies),
    validMemberBallots: seen.size,
    invalidBallots,
    allChambersApproved: Object.values(chamberTallies).every((tally) => tally.approved)
  };
}

function proposalState(proposal, tally, now = new Date()) {
  const opensAt = new Date(proposal.opensAt);
  const closesAt = new Date(proposal.closesAt);
  if (now < opensAt) return 'SCHEDULED';
  if (now <= closesAt) return 'OPEN';
  if (tally.chambers.some((chamber) => !chamber.quorumReached)) return 'QUORUM_NOT_MET';
  return tally.allChambersApproved ? 'RATIFIED' : 'REJECTED';
}

function publicProposal(proposal, now = new Date()) {
  const tally = tallyProposal(proposal);
  const state = proposalState(proposal, tally, now);
  const executableAfter = state === 'RATIFIED'
    ? new Date(new Date(proposal.closesAt).getTime() + proposal.timelockHours * 3600000).toISOString()
    : null;
  return {
    ...proposal,
    digest: proposalDigest(proposal),
    state,
    tally,
    executableAfter,
    executionReady: Boolean(executableAfter && now >= new Date(executableAfter)),
    executionAutomatic: false
  };
}

function governanceOverview(now = new Date()) {
  const proposals = registry.proposals.map((proposal) => publicProposal(proposal, now));
  return {
    ok: true,
    schemaVersion: registry.schemaVersion,
    updatedAt: registry.updatedAt,
    network: registry.network,
    constitution: registry.constitution,
    summary: {
      proposalCount: proposals.length,
      openProposalCount: proposals.filter((proposal) => proposal.state === 'OPEN').length,
      admittedMemberCount: registry.members.filter((member) => member.status === 'active' && member.kind !== 'ai').length,
      canonicalBallotCount: registry.ballots.length,
      canonicalDelegationCount: registry.delegations.length,
      chamberCount: registry.constitution.chambers.length
    },
    proposals
  };
}

module.exports = {
  DaoValidationError,
  didFromPublicKey,
  governanceOverview,
  membershipRequestUrl,
  normalizeBallotPayload,
  normalizeDelegationPayload,
  proposalDigest,
  publicProposal,
  registry,
  sha256,
  stableStringify,
  tallyProposal,
  verifyBallotEnvelope,
  verifyDelegationEnvelope
};

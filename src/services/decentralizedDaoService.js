const crypto = require('crypto');
const registry = require('../../frontend/src/data/daoGovernance.json');

const BALLOT_CHOICES = ['for', 'against', 'abstain'];
const DELEGATION_ACTIONS = ['delegate', 'revoke'];
const MAX_REASON_LENGTH = 500;
const MAX_KEY_LENGTH = 512;

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

function getProposal(proposalId, source = registry) {
  return source.proposals.find((proposal) => proposal.id === proposalId) || null;
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

function validateCommonSignedPayload(payload, didField, source = registry, now = new Date()) {
  if (payload.schemaVersion !== source.schemaVersion) {
    throw new DaoValidationError('Versione schema non supportata', 400, 'UNSUPPORTED_SCHEMA');
  }
  if (payload.networkId !== source.network.id) {
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

function memberFor(did, publicKeySpki, source = registry) {
  return source.members.find((member) => (
    member.did === did
    && member.publicKeySpki === publicKeySpki
    && member.status === 'active'
    && member.kind !== 'ai'
  )) || null;
}

function chambersFor(member, source = registry) {
  if (!member) return [];
  const allowed = new Set(source.constitution.chambers.map((chamber) => chamber.id));
  return (member.chambers || []).filter((chamber) => allowed.has(chamber));
}

function buildIssueUrl(title, body, labels, source = registry) {
  const params = new URLSearchParams({ title, body });
  if (labels) params.set('labels', labels);
  return `${source.network.canonicalRepository}/issues/new?${params.toString()}`;
}

function membershipRequestUrl(identity, source = registry) {
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
  return buildIssueUrl(`[DAO MEMBERSHIP] ${identity.voterDid.slice(0, 24)}…`, body, 'dao,membership', source);
}

function ballotSubmissionUrl(receipt, source = registry) {
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
  return buildIssueUrl(`[DAO BALLOT] ${receipt.payload.proposalId} · ${receipt.payload.voterDid.slice(0, 24)}…`, body, 'dao,ballot', source);
}

function delegationSubmissionUrl(receipt, source = registry) {
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
  return buildIssueUrl(`[DAO DELEGATION] ${receipt.payload.scope} · ${receipt.payload.delegatorDid.slice(0, 24)}…`, body, 'dao,delegation', source);
}

function verifyBallotEnvelope(envelope = {}, options = {}) {
  const source = options.source || registry;
  const now = options.now || new Date();
  const payload = normalizeBallotPayload(envelope.payload);
  const proposal = getProposal(payload.proposalId, source);
  if (!proposal) throw new DaoValidationError('Proposta DAO non trovata', 404, 'PROPOSAL_NOT_FOUND');
  if (!BALLOT_CHOICES.includes(payload.choice)) {
    throw new DaoValidationError('Scelta non valida: usare for, against o abstain', 400, 'INVALID_CHOICE');
  }
  if (payload.reason.length > MAX_REASON_LENGTH) {
    throw new DaoValidationError(`Motivazione troppo lunga (massimo ${MAX_REASON_LENGTH} caratteri)`, 400, 'REASON_TOO_LONG');
  }

  const issuedAt = validateCommonSignedPayload(payload, 'voterDid', source, now);
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
  const member = memberFor(payload.voterDid, payload.publicKeySpki, source);
  const chambers = chambersFor(member, source);
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
      verifiedAt: now.toISOString(),
      sourceOfTruth: source.network.ledgerPath,
      automaticExecution: false
    }
  };

  return {
    ...receipt,
    submissionUrl: ballotSubmissionUrl(receipt, source),
    membershipRequestUrl: member ? null : membershipRequestUrl(payload, source)
  };
}

function verifyDelegationEnvelope(envelope = {}, options = {}) {
  const source = options.source || registry;
  const now = options.now || new Date();
  const payload = normalizeDelegationPayload(envelope.payload);
  if (!DELEGATION_ACTIONS.includes(payload.action)) {
    throw new DaoValidationError('Azione delega non valida', 400, 'INVALID_DELEGATION_ACTION');
  }
  if (!payload.delegateDid.startsWith('did:myz:')) {
    throw new DaoValidationError('DID del delegato non valido', 400, 'INVALID_DELEGATE');
  }
  if (!['all', ...source.proposals.map((proposal) => `proposal:${proposal.id}`)].includes(payload.scope)) {
    throw new DaoValidationError('Ambito delega non valido', 400, 'INVALID_DELEGATION_SCOPE');
  }
  if (payload.delegatorDid === payload.delegateDid) {
    throw new DaoValidationError('Non puoi delegare a te stesso', 400, 'SELF_DELEGATION');
  }

  const issuedAt = validateCommonSignedPayload(payload, 'delegatorDid', source, now);
  const expiresAt = new Date(payload.expiresAt);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt <= issuedAt) {
    throw new DaoValidationError('Scadenza delega non valida', 400, 'INVALID_DELEGATION_EXPIRY');
  }
  verifyEd25519(payload, envelope.signature, payload.publicKeySpki);

  const member = memberFor(payload.delegatorDid, payload.publicKeySpki, source);
  const payloadDigest = sha256(stableStringify(payload));
  const receiptDigest = sha256(stableStringify({ payloadDigest, signature: envelope.signature }));
  const receipt = {
    verified: true,
    canonical: false,
    counted: Boolean(member),
    eligibility: member ? 'member' : 'observer',
    chambers: chambersFor(member, source),
    payload,
    signature: envelope.signature,
    payloadDigest,
    receiptDigest,
    verification: {
      algorithm: 'Ed25519',
      verifiedAt: now.toISOString(),
      maxDelegationDepth: source.constitution.delegationMaxDepth,
      sourceOfTruth: source.network.ledgerPath
    }
  };
  return { ...receipt, submissionUrl: delegationSubmissionUrl(receipt, source) };
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

function activeDelegationsForProposal(proposal, source = registry, now = new Date()) {
  const effectiveAt = now > new Date(proposal.closesAt) ? new Date(proposal.closesAt) : now;
  const latestByDelegatorAndScope = new Map();
  const invalidDelegations = [];

  for (const envelope of source.delegations || []) {
    try {
      const receipt = verifyDelegationEnvelope(envelope, { source, now });
      const issuedAt = new Date(receipt.payload.issuedAt);
      if (!receipt.counted || issuedAt > effectiveAt) continue;
      const key = `${receipt.payload.delegatorDid}|${receipt.payload.scope}`;
      const previous = latestByDelegatorAndScope.get(key);
      if (!previous || issuedAt > new Date(previous.payload.issuedAt)) {
        latestByDelegatorAndScope.set(key, receipt);
      }
    } catch (error) {
      invalidDelegations.push({ receiptDigest: envelope.receiptDigest || null, code: error.code || 'INVALID' });
    }
  }

  function active(receipt) {
    return receipt
      && receipt.payload.action === 'delegate'
      && new Date(receipt.payload.expiresAt) > effectiveAt;
  }

  const byDelegator = new Map();
  for (const member of source.members || []) {
    if (member.status !== 'active' || member.kind === 'ai') continue;
    const proposalScope = latestByDelegatorAndScope.get(`${member.did}|proposal:${proposal.id}`);
    const globalScope = latestByDelegatorAndScope.get(`${member.did}|all`);
    const selected = proposalScope === undefined ? globalScope : proposalScope;
    if (active(selected)) byDelegator.set(member.did, selected);
  }

  return { byDelegator, invalidDelegations, effectiveAt: effectiveAt.toISOString() };
}

function delegationCycles(delegationsByMember) {
  const cycles = [];
  const seenCycles = new Set();
  for (const startDid of delegationsByMember.keys()) {
    const path = [];
    const pathIndex = new Map();
    let currentDid = startDid;
    while (delegationsByMember.has(currentDid)) {
      if (pathIndex.has(currentDid)) {
        const cycle = path.slice(pathIndex.get(currentDid));
        const signature = [...cycle].sort().join('|');
        if (!seenCycles.has(signature)) {
          seenCycles.add(signature);
          cycles.push(cycle);
        }
        break;
      }
      pathIndex.set(currentDid, path.length);
      path.push(currentDid);
      currentDid = delegationsByMember.get(currentDid).payload.delegateDid;
    }
  }
  return cycles;
}

function delegationChains(delegationsByMember) {
  const chains = [];
  for (const [delegatorDid, receipt] of delegationsByMember.entries()) {
    const delegateDid = receipt.payload.delegateDid;
    const downstream = delegationsByMember.get(delegateDid);
    if (downstream) chains.push([delegatorDid, delegateDid, downstream.payload.delegateDid]);
  }
  return chains;
}

function tallyProposal(proposal, options = {}) {
  const source = options.source || registry;
  const now = options.now || new Date();
  const chamberTallies = Object.fromEntries(
    source.constitution.chambers.map((chamber) => [chamber.id, emptyChamberTally(chamber)])
  );
  const directBallots = new Map();
  const invalidBallots = [];

  for (const envelope of source.ballots || []) {
    if (envelope?.payload?.proposalId !== proposal.id) continue;
    try {
      const receipt = verifyBallotEnvelope(envelope, { source, now });
      if (!receipt.counted) continue;
      if (directBallots.has(receipt.payload.voterDid)) {
        invalidBallots.push({ receiptDigest: receipt.receiptDigest, code: 'DUPLICATE_BALLOT' });
      } else {
        directBallots.set(receipt.payload.voterDid, receipt);
      }
    } catch (error) {
      invalidBallots.push({ receiptDigest: envelope.receiptDigest || null, code: error.code || 'INVALID' });
    }
  }

  const delegationState = activeDelegationsForProposal(proposal, source, now);
  const cycles = delegationCycles(delegationState.byDelegator);
  const chains = delegationChains(delegationState.byDelegator);
  const cycleMembers = new Set(cycles.flat());
  const countedMembers = new Set();
  const delegatedVotes = [];
  let directBallotCount = 0;
  let delegatedBallotCount = 0;

  for (const member of source.members || []) {
    if (member.status !== 'active' || member.kind === 'ai') continue;
    let ballot = directBallots.get(member.did);
    let delegatedBy = null;

    if (ballot) {
      directBallotCount += 1;
    } else if (!cycleMembers.has(member.did)) {
      const delegation = delegationState.byDelegator.get(member.did);
      if (delegation && !cycleMembers.has(delegation.payload.delegateDid)) {
        ballot = directBallots.get(delegation.payload.delegateDid);
        if (ballot) {
          delegatedBy = delegation.payload.delegateDid;
          delegatedBallotCount += 1;
          delegatedVotes.push({ delegatorDid: member.did, delegateDid: delegatedBy, scope: delegation.payload.scope });
        }
      }
    }

    if (!ballot) continue;
    countedMembers.add(member.did);
    for (const chamber of chambersFor(member, source)) {
      const tally = chamberTallies[chamber];
      if (tally) tally[ballot.payload.choice] += 1;
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
    validMemberBallots: countedMembers.size,
    directBallotCount,
    delegatedBallotCount,
    delegatedVotes,
    invalidBallots,
    invalidDelegations: delegationState.invalidDelegations,
    delegationCycles: cycles,
    delegationChains: chains,
    allChambersApproved: Object.values(chamberTallies).every((tally) => tally.approved)
  };
}

function validateRegistry(source = registry, options = {}) {
  const now = options.now || new Date();
  const errors = [];
  const seenProposalIds = new Set();
  const seenMemberDids = new Set();
  const seenMemberKeys = new Set();
  const seenBallots = new Set();
  const seenNonces = new Set();
  const seenReceipts = new Set();
  const chamberIds = new Set((source.constitution?.chambers || []).map((chamber) => chamber.id));

  function add(code, detail) {
    errors.push({ code, detail });
  }

  if (!source.network || source.network.automaticExecution !== false || source.network.externalSettlement !== false) {
    add('UNSAFE_NETWORK_POLICY', 'automaticExecution ed externalSettlement devono essere false');
  }
  if (source.constitution?.aiActors?.bindingVotingWeight !== 0) {
    add('AI_VOTING_WEIGHT', 'Il peso vincolante degli attori AI deve essere zero');
  }
  if ((source.constitution?.chambers || []).length < 2) {
    add('INSUFFICIENT_CHAMBERS', 'Sono richieste almeno due camere');
  }

  for (const proposal of source.proposals || []) {
    if (!proposal.id || seenProposalIds.has(proposal.id)) add('DUPLICATE_PROPOSAL', proposal.id || 'missing-id');
    seenProposalIds.add(proposal.id);
    if (new Date(proposal.opensAt) >= new Date(proposal.closesAt)) add('INVALID_PROPOSAL_WINDOW', proposal.id);
    if (proposal.approvalThresholdBps < 5001 || proposal.approvalThresholdBps > 10000) add('INVALID_THRESHOLD', proposal.id);
    if (proposal.execution?.automatic !== false) add('AUTOMATIC_EXECUTION', proposal.id);
    for (const chamberId of chamberIds) {
      if (!Number.isInteger(proposal.quorum?.[chamberId]) || proposal.quorum[chamberId] < 1) {
        add('INVALID_QUORUM', `${proposal.id}:${chamberId}`);
      }
    }
  }

  for (const member of source.members || []) {
    if (!member.did || seenMemberDids.has(member.did)) add('DUPLICATE_MEMBER_DID', member.did || 'missing-did');
    if (!member.publicKeySpki || seenMemberKeys.has(member.publicKeySpki)) add('DUPLICATE_MEMBER_KEY', member.did || 'missing-key');
    seenMemberDids.add(member.did);
    seenMemberKeys.add(member.publicKeySpki);
    if (member.kind === 'ai' && (member.chambers || []).length) add('AI_MEMBER_HAS_CHAMBER', member.did);
    if (member.kind !== 'ai') {
      try {
        if (didFromPublicKey(member.publicKeySpki) !== member.did) add('MEMBER_DID_KEY_MISMATCH', member.did);
      } catch (error) {
        add(error.code || 'INVALID_MEMBER_KEY', member.did);
      }
      if (member.status === 'active' && !chambersFor(member, source).length) add('MEMBER_WITHOUT_CHAMBER', member.did);
      if ((member.chambers || []).some((chamber) => !chamberIds.has(chamber))) add('UNKNOWN_MEMBER_CHAMBER', member.did);
    }
  }

  for (const envelope of source.ballots || []) {
    try {
      const receipt = verifyBallotEnvelope(envelope, { source, now });
      const ballotKey = `${receipt.payload.proposalId}|${receipt.payload.voterDid}`;
      const nonceKey = `${receipt.payload.voterDid}|${receipt.payload.nonce}`;
      if (!receipt.counted) add('OBSERVER_BALLOT_IN_LEDGER', ballotKey);
      if (seenBallots.has(ballotKey)) add('DUPLICATE_BALLOT', ballotKey);
      if (seenNonces.has(nonceKey)) add('REPLAYED_NONCE', nonceKey);
      if (seenReceipts.has(receipt.receiptDigest)) add('REPLAYED_RECEIPT', receipt.receiptDigest);
      if (envelope.receiptDigest && envelope.receiptDigest !== receipt.receiptDigest) add('RECEIPT_DIGEST_MISMATCH', ballotKey);
      seenBallots.add(ballotKey);
      seenNonces.add(nonceKey);
      seenReceipts.add(receipt.receiptDigest);
    } catch (error) {
      add(error.code || 'INVALID_BALLOT', envelope?.payload?.proposalId || 'unknown');
    }
  }

  for (const envelope of source.delegations || []) {
    try {
      const receipt = verifyDelegationEnvelope(envelope, { source, now });
      const nonceKey = `${receipt.payload.delegatorDid}|${receipt.payload.nonce}`;
      if (!receipt.counted) add('OBSERVER_DELEGATION_IN_LEDGER', receipt.payload.delegatorDid);
      if (seenNonces.has(nonceKey)) add('REPLAYED_NONCE', nonceKey);
      if (seenReceipts.has(receipt.receiptDigest)) add('REPLAYED_RECEIPT', receipt.receiptDigest);
      if (envelope.receiptDigest && envelope.receiptDigest !== receipt.receiptDigest) add('RECEIPT_DIGEST_MISMATCH', receipt.payload.delegatorDid);
      seenNonces.add(nonceKey);
      seenReceipts.add(receipt.receiptDigest);
    } catch (error) {
      add(error.code || 'INVALID_DELEGATION', envelope?.payload?.delegatorDid || 'unknown');
    }
  }

  for (const proposal of source.proposals || []) {
    const tally = tallyProposal(proposal, { source, now });
    for (const cycle of tally.delegationCycles) add('DELEGATION_CYCLE', `${proposal.id}:${cycle.join('<->')}`);
    for (const chain of tally.delegationChains) add('DELEGATION_CHAIN_DEPTH', `${proposal.id}:${chain.join('->')}`);
    for (const invalid of tally.invalidBallots) add(invalid.code, `${proposal.id}:${invalid.receiptDigest || 'unknown'}`);
    for (const invalid of tally.invalidDelegations) add(invalid.code, `${proposal.id}:${invalid.receiptDigest || 'unknown'}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      proposals: (source.proposals || []).length,
      members: (source.members || []).length,
      ballots: (source.ballots || []).length,
      delegations: (source.delegations || []).length,
      receipts: seenReceipts.size
    }
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
  const integrity = validateRegistry(registry, { now });
  return {
    ok: true,
    schemaVersion: registry.schemaVersion,
    updatedAt: registry.updatedAt,
    network: registry.network,
    constitution: registry.constitution,
    integrity,
    summary: {
      proposalCount: proposals.length,
      openProposalCount: proposals.filter((proposal) => proposal.state === 'OPEN').length,
      admittedMemberCount: registry.members.filter((member) => member.status === 'active' && member.kind !== 'ai').length,
      canonicalBallotCount: registry.ballots.length,
      canonicalDelegationCount: registry.delegations.length,
      chamberCount: registry.constitution.chambers.length,
      integrityValid: integrity.valid
    },
    proposals
  };
}

module.exports = {
  DaoValidationError,
  activeDelegationsForProposal,
  didFromPublicKey,
  delegationChains,
  delegationCycles,
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
  validateRegistry,
  verifyBallotEnvelope,
  verifyDelegationEnvelope
};

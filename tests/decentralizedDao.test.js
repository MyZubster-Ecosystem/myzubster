const crypto = require('crypto');
const request = require('supertest');
const app = require('../server');
const {
  didFromPublicKey,
  proposalDigest,
  publicProposal,
  registry,
  stableStringify,
  tallyProposal,
  validateRegistry,
  verifyBallotEnvelope,
  verifyDelegationEnvelope
} = require('../src/services/decentralizedDaoService');

function createIdentity() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  const publicKeySpki = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
  return { publicKeySpki, privateKey, did: didFromPublicKey(publicKeySpki) };
}

function signEnvelope(payload, identity) {
  return {
    payload,
    signature: crypto.sign(null, Buffer.from(stableStringify(payload)), identity.privateKey).toString('base64')
  };
}

function ballotPayload(identity, proposal = registry.proposals[0], overrides = {}) {
  return {
    schemaVersion: registry.schemaVersion,
    networkId: registry.network.id,
    proposalId: proposal.id,
    proposalDigest: proposalDigest(proposal),
    voterDid: identity.did,
    publicKeySpki: identity.publicKeySpki,
    choice: 'for',
    reason: 'Le evidenze e i confini sono espliciti.',
    nonce: '0123456789abcdef0123456789abcdef',
    issuedAt: '2026-08-25T12:00:00.000Z',
    ...overrides
  };
}

function delegationPayload(identity, delegateDid, overrides = {}) {
  return {
    schemaVersion: registry.schemaVersion,
    networkId: registry.network.id,
    action: 'delegate',
    delegatorDid: identity.did,
    publicKeySpki: identity.publicKeySpki,
    delegateDid,
    scope: 'proposal:MIP-001',
    nonce: crypto.randomBytes(16).toString('hex'),
    issuedAt: '2026-08-25T12:05:00.000Z',
    expiresAt: '2026-09-30T12:00:00.000Z',
    ...overrides
  };
}

function member(identity, chambers) {
  return {
    did: identity.did,
    displayName: identity.did.slice(-8),
    kind: 'human',
    publicKeySpki: identity.publicKeySpki,
    chambers,
    status: 'active',
    admittedAt: '2026-08-24T12:00:00.000Z'
  };
}

describe('Decentralized Git-native DAO', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-25T12:30:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('GET /api/dao publishes the constitution and deterministic proposal digests', async () => {
    const response = await request(app).get('/api/dao');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.network.mode).toBe('off-chain-git-native');
    expect(response.body.network.automaticExecution).toBe(false);
    expect(response.body.constitution.aiActors.bindingVotingWeight).toBe(0);
    expect(response.body.constitution.chambers).toHaveLength(2);
    expect(response.body.summary.proposalCount).toBe(3);
    expect(response.body.summary.integrityValid).toBe(true);
    expect(response.body.integrity.errors).toEqual([]);
    expect(response.body.proposals[0].digest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  test('GET /api/dao/integrity exposes the merge-gate result', async () => {
    const response = await request(app).get('/api/dao/integrity');
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.integrity.valid).toBe(true);
    expect(response.body.integrity.summary).toEqual({ proposals: 3, members: 0, ballots: 0, delegations: 0, receipts: 0 });
  });

  test('GET /api/dao/proposals/:id exposes bounty integration and separate chamber tallies', async () => {
    const response = await request(app).get('/api/dao/proposals/MIP-001');
    expect(response.status).toBe(200);
    expect(response.body.proposal.target).toEqual(expect.objectContaining({
      type: 'bounty-program',
      id: 'MYZ-ENTITY-COMPLETION-001'
    }));
    expect(response.body.proposal.tally.chambers.map((chamber) => chamber.id)).toEqual(['community', 'stewards']);
    expect(response.body.proposal.executionAutomatic).toBe(false);
  });

  test('a valid Ed25519 ballot receives a verifiable observer receipt', () => {
    const identity = createIdentity();
    const envelope = signEnvelope(ballotPayload(identity), identity);
    const receipt = verifyBallotEnvelope(envelope);

    expect(receipt.verified).toBe(true);
    expect(receipt.canonical).toBe(false);
    expect(receipt.counted).toBe(false);
    expect(receipt.eligibility).toBe('observer');
    expect(receipt.receiptDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(receipt.membershipRequestUrl).toMatch(/^https:\/\/github\.com\/MyZubster-Ecosystem\/myzubster\/issues\/new\?/);
    expect(receipt.submissionUrl).toContain('DAO+BALLOT');
  });

  test('POST /api/dao/ballots/verify verifies the signed canonical payload', async () => {
    const identity = createIdentity();
    const envelope = signEnvelope(ballotPayload(identity), identity);
    const response = await request(app).post('/api/dao/ballots/verify').send(envelope);

    expect(response.status).toBe(200);
    expect(response.body.receipt.verified).toBe(true);
    expect(response.body.receipt.payload.voterDid).toBe(identity.did);
    expect(response.body.receipt.verification.algorithm).toBe('Ed25519');
  });

  test('a ballot modified after signing is rejected', () => {
    const identity = createIdentity();
    const envelope = signEnvelope(ballotPayload(identity), identity);
    envelope.payload.choice = 'against';
    expect(() => verifyBallotEnvelope(envelope)).toThrow('Firma Ed25519 non verificabile');
  });

  test('a public key cannot impersonate another DID', () => {
    const identity = createIdentity();
    const payload = ballotPayload(identity, registry.proposals[0], { voterDid: `did:myz:${'0'.repeat(64)}` });
    const envelope = signEnvelope(payload, identity);
    expect(() => verifyBallotEnvelope(envelope)).toThrow('DID e chiave pubblica non corrispondono');
  });

  test('a stale proposal digest is rejected even with a valid signature', () => {
    const identity = createIdentity();
    const payload = ballotPayload(identity, registry.proposals[0], { proposalDigest: `sha256:${'0'.repeat(64)}` });
    const envelope = signEnvelope(payload, identity);
    expect(() => verifyBallotEnvelope(envelope)).toThrow('Digest della proposta non corrispondente');
  });

  test('a ballot signed outside the declared window is rejected', () => {
    const identity = createIdentity();
    const payload = ballotPayload(identity, registry.proposals[0], { issuedAt: '2026-08-23T23:59:59.000Z' });
    const envelope = signEnvelope(payload, identity);
    expect(() => verifyBallotEnvelope(envelope)).toThrow('fuori dalla finestra di voto');
  });

  test('a ballot cannot be pre-signed with a future timestamp', () => {
    const identity = createIdentity();
    const payload = ballotPayload(identity, registry.proposals[0], { issuedAt: '2026-08-26T12:00:00.000Z' });
    const envelope = signEnvelope(payload, identity);
    expect(() => verifyBallotEnvelope(envelope)).toThrow('data di firma è nel futuro');
  });

  test('self-delegation is rejected', () => {
    const identity = createIdentity();
    const payload = {
      schemaVersion: registry.schemaVersion,
      networkId: registry.network.id,
      action: 'delegate',
      delegatorDid: identity.did,
      publicKeySpki: identity.publicKeySpki,
      delegateDid: identity.did,
      scope: 'proposal:MIP-001',
      nonce: 'abcdef0123456789abcdef0123456789',
      issuedAt: '2026-08-25T12:00:00.000Z',
      expiresAt: '2026-09-01T12:00:00.000Z'
    };
    const envelope = signEnvelope(payload, identity);
    expect(() => verifyDelegationEnvelope(envelope)).toThrow('Non puoi delegare a te stesso');
  });

  test('a direct signed delegation produces a non-canonical receipt', () => {
    const identity = createIdentity();
    const delegate = createIdentity();
    const payload = {
      schemaVersion: registry.schemaVersion,
      networkId: registry.network.id,
      action: 'delegate',
      delegatorDid: identity.did,
      publicKeySpki: identity.publicKeySpki,
      delegateDid: delegate.did,
      scope: 'proposal:MIP-001',
      nonce: 'abcdef0123456789abcdef0123456789',
      issuedAt: '2026-08-25T12:00:00.000Z',
      expiresAt: '2026-09-01T12:00:00.000Z'
    };
    const receipt = verifyDelegationEnvelope(signEnvelope(payload, identity));
    expect(receipt.verified).toBe(true);
    expect(receipt.canonical).toBe(false);
    expect(receipt.eligibility).toBe('observer');
    expect(receipt.submissionUrl).toContain('DAO+DELEGATION');
  });

  test('a proposal cannot pass after closing without both quorums', () => {
    const proposal = publicProposal(registry.proposals[0], new Date('2026-09-10T00:00:00.000Z'));
    expect(proposal.state).toBe('QUORUM_NOT_MET');
    expect(proposal.executionReady).toBe(false);
    expect(proposal.tally.chambers.every((chamber) => chamber.quorumReached === false)).toBe(true);
  });

  test('the canonical registry passes merge-gate validation', () => {
    const validation = validateRegistry(registry, { now: new Date('2026-08-25T12:30:00.000Z') });
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);
  });

  test('direct delegations count in the delegator chamber and can satisfy both quorums', () => {
    const communityA = createIdentity();
    const communityB = createIdentity();
    const communityC = createIdentity();
    const stewardA = createIdentity();
    const stewardB = createIdentity();
    const source = {
      ...registry,
      members: [
        member(communityA, ['community']),
        member(communityB, ['community']),
        member(communityC, ['community']),
        member(stewardA, ['stewards']),
        member(stewardB, ['stewards'])
      ],
      ballots: [
        signEnvelope(ballotPayload(communityA, registry.proposals[0], { nonce: crypto.randomBytes(16).toString('hex') }), communityA),
        signEnvelope(ballotPayload(communityC, registry.proposals[0], { nonce: crypto.randomBytes(16).toString('hex') }), communityC),
        signEnvelope(ballotPayload(stewardA, registry.proposals[0], { nonce: crypto.randomBytes(16).toString('hex') }), stewardA)
      ],
      delegations: [
        signEnvelope(delegationPayload(communityB, communityA.did), communityB),
        signEnvelope(delegationPayload(stewardB, stewardA.did), stewardB)
      ]
    };

    const tally = tallyProposal(source.proposals[0], { source, now: new Date('2026-09-10T00:00:00.000Z') });
    expect(tally.directBallotCount).toBe(3);
    expect(tally.delegatedBallotCount).toBe(2);
    expect(tally.validMemberBallots).toBe(5);
    expect(tally.chambers).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'community', for: 3, quorumReached: true, approved: true }),
      expect.objectContaining({ id: 'stewards', for: 2, quorumReached: true, approved: true })
    ]));
    expect(tally.allChambersApproved).toBe(true);
    expect(validateRegistry(source, { now: new Date('2026-09-10T00:00:00.000Z') }).valid).toBe(true);
  });

  test('a direct ballot overrides an existing delegation', () => {
    const delegator = createIdentity();
    const delegate = createIdentity();
    const source = {
      ...registry,
      members: [member(delegator, ['community']), member(delegate, ['community'])],
      ballots: [
        signEnvelope(ballotPayload(delegator, registry.proposals[0], { choice: 'against', nonce: crypto.randomBytes(16).toString('hex') }), delegator),
        signEnvelope(ballotPayload(delegate, registry.proposals[0], { choice: 'for', nonce: crypto.randomBytes(16).toString('hex') }), delegate)
      ],
      delegations: [signEnvelope(delegationPayload(delegator, delegate.did), delegator)]
    };
    const tally = tallyProposal(source.proposals[0], { source, now: new Date('2026-08-26T00:00:00.000Z') });
    const community = tally.chambers.find((chamber) => chamber.id === 'community');
    expect(community.for).toBe(1);
    expect(community.against).toBe(1);
    expect(tally.directBallotCount).toBe(2);
    expect(tally.delegatedBallotCount).toBe(0);
  });

  test('the merge gate rejects duplicate ballots, nonce replay and delegation cycles', () => {
    const memberA = createIdentity();
    const memberB = createIdentity();
    const memberC = createIdentity();
    const ballot = signEnvelope(ballotPayload(memberA), memberA);
    const source = {
      ...registry,
      members: [member(memberA, ['community']), member(memberB, ['community']), member(memberC, ['community'])],
      ballots: [ballot, ballot],
      delegations: [
        signEnvelope(delegationPayload(memberA, memberB.did, { nonce: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }), memberA),
        signEnvelope(delegationPayload(memberB, memberC.did, { nonce: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' }), memberB),
        signEnvelope(delegationPayload(memberC, memberA.did, { nonce: 'cccccccccccccccccccccccccccccccc' }), memberC)
      ]
    };
    const validation = validateRegistry(source, { now: new Date('2026-08-26T00:00:00.000Z') });
    expect(validation.valid).toBe(false);
    expect(validation.errors.map((error) => error.code)).toEqual(expect.arrayContaining([
      'DUPLICATE_BALLOT',
      'REPLAYED_NONCE',
      'REPLAYED_RECEIPT',
      'DELEGATION_CYCLE',
      'DELEGATION_CHAIN_DEPTH'
    ]));
  });
});

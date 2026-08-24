const crypto = require('crypto');
const request = require('supertest');
const app = require('../server');
const {
  didFromPublicKey,
  proposalDigest,
  publicProposal,
  registry,
  stableStringify,
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
    expect(response.body.proposals[0].digest).toMatch(/^sha256:[a-f0-9]{64}$/);
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
});

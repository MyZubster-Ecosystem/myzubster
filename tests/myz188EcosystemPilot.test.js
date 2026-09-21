const express = require('express');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const manifest = require('../data/ecosystem-pilots/myz-188-university-developer-community.json');
const communityValidation = require('../data/ecosystem-pilots/myz-188-community-validation.json');
const evidenceRecord = require('../data/ecosystem-pilots/myz-188-evidence.json');
const { buildPilotEvidence } = require('../scripts/ecosystem/seed-myz-188-pilot');
const { verifyKnowledgeEvidence } = require('../src/services/knowledgeEvidenceService');
const EcosystemActor = require('../src/models/EcosystemActor');
const EcosystemContribution = require('../src/models/EcosystemContribution');
const ecosystemContributionRoutes = require('../src/routes/ecosystemContributionRoutes');

describe('MYZ-188 University → Developer → Community pilot', () => {
  let mongo;
  const ownerId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  }, 30000);

  afterEach(async () => {
    await Promise.all([
      EcosystemActor.deleteMany({}),
      EcosystemContribution.deleteMany({})
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
  });

  test('defines three distinct actor roles without institutional or financial claims', () => {
    expect(manifest.actors.map(actor => actor.role).sort()).toEqual([
      'community',
      'developer',
      'university'
    ]);
    expect(new Set(manifest.actors.map(actor => actor.actorId)).size).toBe(3);
    expect(manifest.boundaries).toEqual({
      externalUniversityEndorsement: false,
      institutionalPartnership: false,
      employment: false,
      funding: false,
      bountyApprovalInferred: false,
      paymentInferred: false,
      communityGovernanceApproval: false
    });
    expect(communityValidation.status).toBe('CONTRACT_PASS_RUNTIME_PENDING');
  });

  test('binds the pilot to one issue, one implementation commit and one separate community validation commit', () => {
    expect(manifest.canonicalWorkItem.url).toBe('https://github.com/MyZubster-Ecosystem/myzubster/issues/1335');
    expect(manifest.implementation.sha).toMatch(/^[a-f0-9]{40}$/);
    expect(manifest.communityValidation.sha).toMatch(/^[a-f0-9]{40}$/);
    expect(manifest.implementation.sha).not.toBe(manifest.communityValidation.sha);
  });

  test('creates canonical SHA-256 pilot evidence from public references', () => {
    const evidence = buildPilotEvidence();
    expect(evidence.algorithm).toBe('sha256');
    expect(evidence.evidenceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(evidence.commitment).toBe(`MZ-KNOWLEDGE-V1:${evidence.evidenceHash}`);
    expect(verifyKnowledgeEvidence(evidence.payload, evidence.evidenceHash)).toBe(true);
    expect(evidenceRecord.evidenceHash).toBe(evidence.evidenceHash);
    expect(evidenceRecord.commitment).toBe(evidence.commitment);
    expect(manifest.evidence.recordPath).toBe('data/ecosystem-pilots/myz-188-evidence.json');

    const refs = evidence.payload.evidenceRefs.map(item => item.reference);
    expect(refs).toContain(manifest.canonicalWorkItem.url);
    expect(refs).toContain(manifest.implementation.commitUrl);
    expect(refs).toContain(manifest.communityValidation.commitUrl);
  });

  test('exposes University, Developer and Community through the ecosystem graph contract', async () => {
    for (const actor of manifest.actors) {
      await EcosystemActor.create({
        actorId: actor.actorId,
        type: actor.type,
        name: actor.name,
        slug: actor.slug,
        description: actor.description,
        projects: [manifest.projectId],
        status: 'active',
        createdBy: ownerId,
        updatedBy: ownerId
      });
    }

    const evidence = buildPilotEvidence();
    const sourceSpecs = [
      {
        actorId: 'actor-myz-188-university',
        suffix: 'issue',
        title: 'Research proposal / canonical work item',
        github: {
          kind: 'issue',
          sourceKey: 'MyZubster-Ecosystem/myzubster#issue-1335',
          repository: 'MyZubster-Ecosystem/myzubster',
          number: 1335,
          url: manifest.canonicalWorkItem.url,
          title: 'MYZ-188 canonical work item',
          sourceState: 'open',
          verifiedAt: new Date()
        },
        evidenceRefs: []
      },
      {
        actorId: 'actor-myz-188-developer',
        suffix: 'implementation',
        title: 'Developer implementation',
        github: {
          kind: 'commit',
          sourceKey: `MyZubster-Ecosystem/myzubster@${manifest.implementation.sha}`,
          repository: 'MyZubster-Ecosystem/myzubster',
          sha: manifest.implementation.sha,
          url: manifest.implementation.commitUrl,
          title: 'MYZ-188 implementation',
          sourceState: 'exists',
          verifiedAt: new Date()
        },
        evidenceRefs: [evidence.commitment]
      },
      {
        actorId: 'actor-myz-188-community',
        suffix: 'validation',
        title: 'Community validation record',
        github: {
          kind: 'commit',
          sourceKey: `MyZubster-Ecosystem/myzubster@${manifest.communityValidation.sha}`,
          repository: 'MyZubster-Ecosystem/myzubster',
          sha: manifest.communityValidation.sha,
          url: manifest.communityValidation.commitUrl,
          title: 'MYZ-188 community validation',
          sourceState: 'exists',
          verifiedAt: new Date()
        },
        evidenceRefs: [evidence.commitment]
      }
    ];

    for (const spec of sourceSpecs) {
      await EcosystemContribution.create({
        contributionId: `contrib-myz-188-${spec.suffix}`,
        actorIds: [spec.actorId],
        projectId: manifest.projectId,
        title: spec.title,
        status: spec.github.kind === 'issue' ? 'opened' : 'proposed',
        github: spec.github,
        evidenceRefs: spec.evidenceRefs,
        dedupeKey: EcosystemContribution.buildDedupeKey({
          actorIds: [spec.actorId],
          projectId: manifest.projectId,
          sourceKey: spec.github.sourceKey
        }),
        createdBy: ownerId,
        updatedBy: ownerId
      });
    }

    const app = express();
    app.use('/api/ecosystem', ecosystemContributionRoutes);

    const response = await request(app)
      .get(`/api/ecosystem/graph?projectId=${manifest.projectId}`);

    expect(response.status).toBe(200);
    expect(response.body.schema).toBe('myzubster.contribution-graph.v1');
    expect(response.body.nodes.filter(node => node.kind === 'actor')).toHaveLength(3);
    expect(response.body.nodes.some(node => node.kind === 'project' && node.label === manifest.projectId)).toBe(true);
    expect(response.body.nodes.some(node => node.kind === 'evidence' && node.label === evidence.commitment)).toBe(true);
    expect(response.body.edges.filter(edge => edge.relation === 'CONTRIBUTED')).toHaveLength(3);
    expect(response.body.boundaries.githubStateIsPaymentState).toBe(false);
    expect(response.body.boundaries.institutionalAffiliationInferred).toBe(false);
  });
});

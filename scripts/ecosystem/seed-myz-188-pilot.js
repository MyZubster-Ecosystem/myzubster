'use strict';

const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const EcosystemActor = require('../../src/models/EcosystemActor');
const EcosystemContribution = require('../../src/models/EcosystemContribution');
const {
  verifyUser,
  verifyRepository,
  verifyContributionSource
} = require('../../src/services/githubEcosystemVerificationService');
const { buildGithubWorkEvidence } = require('../../src/services/githubWorkEvidenceService');
const {
  buildKnowledgeEvidence,
  hashKnowledgeEvidence
} = require('../../src/services/knowledgeEvidenceService');

const manifest = require('../../data/ecosystem-pilots/myz-188-university-developer-community.json');
const communityValidation = require('../../data/ecosystem-pilots/myz-188-community-validation.json');

function requiredObjectId(value, name) {
  if (!mongoose.isValidObjectId(value)) throw new Error(`${name} must be a valid MongoDB ObjectId`);
  return new mongoose.Types.ObjectId(value);
}

function contributionStatus(source) {
  if (source.kind === 'pull_request') {
    if (source.merged) return 'merged';
    return source.sourceState === 'closed' ? 'closed' : 'opened';
  }
  if (source.kind === 'issue') return source.sourceState === 'closed' ? 'closed' : 'opened';
  return 'proposed';
}

async function verifyPublicRepository(fullName) {
  const repo = await verifyRepository(fullName);
  if (repo.visibility !== 'public') {
    throw new Error(`Pilot repository must be public: ${fullName}`);
  }
  return repo;
}

async function upsertActor(actorSpec, ownerId) {
  const identity = await verifyUser(actorSpec.github.login);
  const repository = await verifyPublicRepository(actorSpec.github.repository);
  const now = new Date();

  return EcosystemActor.findOneAndUpdate(
    { actorId: actorSpec.actorId },
    {
      $set: {
        type: actorSpec.type,
        name: actorSpec.name,
        slug: actorSpec.slug,
        description: actorSpec.description,
        github: {
          login: identity.login,
          org: '',
          repositories: [repository.fullName],
          verification: {
            verifiedLogin: identity.login,
            githubUserId: identity.githubUserId,
            profileUrl: identity.profileUrl,
            verifiedAt: now
          },
          verifiedRepositories: [{
            fullName: repository.fullName,
            githubRepositoryId: repository.githubRepositoryId,
            htmlUrl: repository.htmlUrl,
            owner: repository.owner,
            visibility: repository.visibility,
            verifiedAt: now
          }]
        },
        projects: [manifest.projectId],
        skills: actorSpec.skills || [],
        evidence: [],
        status: 'active',
        updatedBy: ownerId
      },
      $setOnInsert: { createdBy: ownerId }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

function buildPilotEvidence() {
  const refs = [
    manifest.canonicalWorkItem.url,
    manifest.implementation.commitUrl,
    communityValidation.source.commitUrl,
    manifest.manifestUrl
  ].filter(Boolean);

  const payload = buildKnowledgeEvidence({
    subject: manifest.pilotId,
    domain: 'ecosystem-collaboration',
    claim: manifest.claim,
    evidenceLevel: 'repository-verifiable',
    evidenceRefs: refs.map(reference => ({ type: 'public-reference', reference })),
    version: '1'
  });

  const evidenceHash = hashKnowledgeEvidence(payload);
  return {
    payload,
    evidenceHash,
    algorithm: 'sha256',
    commitment: `MZ-KNOWLEDGE-V1:${evidenceHash}`
  };
}

async function upsertContribution({ actorId, title, description, sourceSpec, ownerId, evidenceRefs = [], githubWorkEvidence = {} }) {
  const source = await verifyContributionSource(sourceSpec);
  const dedupeKey = EcosystemContribution.buildDedupeKey({
    actorIds: [actorId],
    projectId: manifest.projectId,
    sourceKey: source.sourceKey
  });

  return EcosystemContribution.findOneAndUpdate(
    { dedupeKey },
    {
      $set: {
        actorIds: [actorId],
        projectId: manifest.projectId,
        title,
        description,
        status: contributionStatus(source),
        github: { ...source, verifiedAt: new Date() },
        evidenceRefs,
        githubWorkEvidence,
        updatedBy: ownerId
      },
      $setOnInsert: {
        contributionId: `contrib-${new mongoose.Types.ObjectId().toString()}`,
        dedupeKey,
        createdBy: ownerId
      }
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGODB_URI or MONGO_URI is required');
  const ownerId = requiredObjectId(process.env.MYZ_ECOSYSTEM_SEED_USER_ID, 'MYZ_ECOSYSTEM_SEED_USER_ID');

  await mongoose.connect(mongoUri);

  try {
    const actorDocs = {};
    for (const actorSpec of manifest.actors) {
      actorDocs[actorSpec.role] = await upsertActor(actorSpec, ownerId);
    }

    const pilotEvidence = buildPilotEvidence();

    const issueContribution = await upsertContribution({
      actorId: actorDocs.university.actorId,
      title: 'Research proposal / canonical work item',
      description: 'Canonical bounded work item for the MYZ-188 technical pilot.',
      sourceSpec: {
        kind: 'issue',
        repository: manifest.canonicalWorkItem.repository,
        number: manifest.canonicalWorkItem.number
      },
      ownerId
    });

    const implementationSource = await verifyContributionSource({
      kind: 'commit',
      repository: manifest.implementation.repository,
      sha: manifest.implementation.sha
    });
    const implementationEvidence = implementationSource.committedAt
      ? buildGithubWorkEvidence({
          account: actorDocs.developer.github.verification.verifiedLogin,
          commits: [{
            sha: implementationSource.sha,
            repository: implementationSource.repository,
            url: implementationSource.url,
            committedAt: implementationSource.committedAt
          }]
        })
      : {};

    const implementationContribution = await upsertContribution({
      actorId: actorDocs.developer.actorId,
      title: 'Developer implementation',
      description: 'Code implementation for the MYZ-188 pilot wiring.',
      sourceSpec: {
        kind: 'commit',
        repository: manifest.implementation.repository,
        sha: manifest.implementation.sha
      },
      ownerId,
      evidenceRefs: [pilotEvidence.commitment],
      githubWorkEvidence: implementationEvidence.evidenceHash ? {
        evidenceHash: implementationEvidence.evidenceHash,
        algorithm: implementationEvidence.algorithm,
        commitment: implementationEvidence.commitment
      } : {}
    });

    const validationContribution = await upsertContribution({
      actorId: actorDocs.community.actorId,
      title: 'Community validation record',
      description: communityValidation.summary,
      sourceSpec: {
        kind: 'commit',
        repository: communityValidation.source.repository,
        sha: communityValidation.source.sha
      },
      ownerId,
      evidenceRefs: [pilotEvidence.commitment]
    });

    for (const actor of Object.values(actorDocs)) {
      actor.evidence = [...new Set([...(actor.evidence || []), pilotEvidence.commitment])];
      actor.updatedBy = ownerId;
      await actor.save();
    }

    process.stdout.write(JSON.stringify({
      success: true,
      pilotId: manifest.pilotId,
      projectId: manifest.projectId,
      actors: Object.fromEntries(Object.entries(actorDocs).map(([role, actor]) => [role, actor.actorId])),
      contributions: [
        issueContribution.contributionId,
        implementationContribution.contributionId,
        validationContribution.contributionId
      ],
      evidence: pilotEvidence,
      graphEndpoint: `/api/ecosystem/graph?projectId=${encodeURIComponent(manifest.projectId)}`,
      boundaries: manifest.boundaries
    }, null, 2) + '\n');
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = { buildPilotEvidence, contributionStatus };

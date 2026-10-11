const {
  getContributorKnowledgeGraph
} = require('./knowledgeGraphService');


const PUBLIC_PROPERTY_KEYS = {
  Knowledge: new Set(['conceptId', 'conceptKey', 'key', 'slug', 'category', 'description', 'status', 'reference']),
  KnowledgeContribution: new Set(['contributionId', 'category', 'description', 'status', 'reference', 'reviewedAt', 'rewardId', 'rewardedAt']),
  Attestation: new Set(['attestationId', 'evidenceType', 'evidenceReference', 'verificationMethod', 'evidenceHash', 'status', 'observedAt', 'createdAt']),
  Reward: new Set(['rewardId', 'amount', 'currency', 'status', 'paidAt']),
  Settlement: new Set(['settlementId', 'status', 'settledAt', 'createdAt'])
};

function publicProperties(type, properties = {}) {
  const allowed = PUBLIC_PROPERTY_KEYS[type] || new Set();

  return Object.fromEntries(
    Object.entries(properties).filter(
      ([key, value]) => allowed.has(key) && value !== undefined
    )
  );
}


async function getPublicKnowledgePassport(contributorId) {
  const id = String(contributorId || '').trim();

  if (!id) {
    throw new Error('Contributor ID is required');
  }

  const graph =
    await getContributorKnowledgeGraph(id);


  const nodes =
    Array.isArray(graph.nodes)
      ? graph.nodes
      : [];

  const edges =
    Array.isArray(graph.edges)
      ? graph.edges
      : [];


  const knowledge =
    nodes
      .filter(node => node.type === 'Knowledge')
      .map(node => ({
        id: node.id,
        name: node.label,
        ...publicProperties(node.type, node.properties)
      }));


  const contributions =
    nodes
      .filter(
        node =>
          node.type === 'KnowledgeContribution'
      )
      .map(node => {

        const demonstrates =
          edges
            .filter(
              edge =>
                edge.from === node.id &&
                edge.type === 'DEMONSTRATES'
            )
            .map(edge =>
              edge.to.replace(/^knowledge:/, '')
            );

        return {
          id: node.id,
          title: node.label,
          ...publicProperties(node.type, node.properties),
          demonstrates
        };
      });


  const attestations =
    nodes
      .filter(
        node =>
          node.type === 'Attestation'
      )
      .map(node => ({
        id: node.id,
        label: node.label,
        ...publicProperties(node.type, node.properties)
      }));


  const rewards =
    nodes
      .filter(
        node =>
          node.type === 'Reward'
      )
      .map(node => {

        const settlementEdge =
          edges.find(
            edge =>
              edge.from === node.id &&
              edge.type === 'SETTLED_BY'
          );

        return {
          id: node.id,
          label: node.label,
          ...publicProperties(node.type, node.properties),

          settlementId:
            settlementEdge
              ? settlementEdge.to
              : null
        };
      });


  const settlements =
    nodes
      .filter(
        node =>
          node.type === 'Settlement'
      )
      .map(node => ({
        id: node.id,
        label: node.label,

        ...publicProperties(node.type,
          node.properties
        )
      }));


  const verifiedAttestations =
    attestations.filter(
      item =>
        item.status === 'VERIFIED'
    ).length;


  const observedAttestations =
    attestations.filter(
      item =>
        item.status === 'OBSERVED'
    ).length;


  const settledRewards =
    settlements.filter(
      item =>
        item.status === 'SETTLED'
    ).length;


  return {

    passportVersion:
      'myzubster-knowledge-passport-v1',

    contributor: {
      id
    },

    summary: {

      knowledge:
        knowledge.length,

      contributions:
        contributions.length,

      attestations:
        attestations.length,

      observedAttestations,

      verifiedAttestations,

      rewards:
        rewards.length,

      settlements:
        settlements.length,

      settledRewards
    },

    knowledge,

    contributions,

    attestations,

    rewards,

    settlements,

    provenance: {

      model:
        'evidence-backed',

      knowledgeStatus:
        'demonstrated',

      verificationPolicy:
        'demonstrated knowledge is not equivalent to independent verification',

      privacyPolicy:
        'public passport exposes provenance while avoiding wallet secrets and private credentials'
    }
  };
}


module.exports = {
  getPublicKnowledgePassport
};

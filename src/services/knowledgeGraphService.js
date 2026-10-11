const KnowledgeConcept =
  require('../models/knowledgeConceptModel');

const KnowledgeClaim =
  require('../models/knowledgeClaimModel');

const KnowledgeContribution =
  require('../models/knowledgeContributionModel');

const KnowledgeAttestation =
  require('../models/knowledgeAttestationModel');

const Reward =
  require('../models/rewardModel');

const Settlement =
  require('../models/settlementModel');


function addNode(nodes, seen, node) {
  if (!node || !node.id || seen.has(node.id)) return;

  seen.add(node.id);
  nodes.push(node);
}


function addEdge(edges, seen, edge) {
  if (!edge || !edge.from || !edge.to || !edge.type) return;

  const key =
    `${edge.from}|${edge.type}|${edge.to}`;

  if (seen.has(key)) return;

  seen.add(key);
  edges.push(edge);
}


function getClaimConceptKey(claim) {
  return (
    claim.conceptKey ||
    claim.conceptId ||
    claim.knowledgeKey ||
    null
  );
}


function getConceptLabel(concept, fallbackKey) {
  return (
    concept?.label ||
    concept?.name ||
    concept?.title ||
    fallbackKey
  );
}


async function getContributorKnowledgeGraph(userId) {
  const contributorId =
    String(userId || '').trim();


  /*
   * ---------------------------------------------------------
   * CONTRIBUTIONS
   * ---------------------------------------------------------
   */

  const contributions =
    await KnowledgeContribution
      .find({
        authorId: contributorId
      })
      .sort({
        createdAt: 1
      })
      .lean();


  const contributionIds =
    contributions
      .map(c => c.contributionId)
      .filter(Boolean);


  /*
   * ---------------------------------------------------------
   * LOAD RELATED DATA
   * ---------------------------------------------------------
   */

  const [
    attestations,
    rewards,
    knowledgeClaims,
    allKnowledgeConcepts,
    settlements
  ] = await Promise.all([

    contributionIds.length
      ? KnowledgeAttestation
          .find({
            contributionId: {
              $in: contributionIds
            }
          })
          .lean()
      : [],


    Reward
      .find({
        userId: contributorId,
        rewardType: 'knowledge_contribution'
      })
      .lean(),


    KnowledgeClaim
      .find({
        contributorId
      })
      .sort({
        createdAt: 1
      })
      .lean(),


    KnowledgeConcept
      .find({})
      .lean(),


    Settlement
      .find({
        contributorId
      })
      .sort({
        createdAt: 1
      })
      .lean()
  ]);


  /*
   * ---------------------------------------------------------
   * CONCEPT LOOKUP
   * ---------------------------------------------------------
   */

  const conceptByKey =
    new Map();


  for (const concept of allKnowledgeConcepts) {

    const possibleKeys = [
      concept.conceptKey,
      concept.conceptId,
      concept.slug,
      concept.key
    ].filter(Boolean);


    for (const key of possibleKeys) {

      conceptByKey.set(
        String(key),
        concept
      );
    }
  }


  /*
   * ---------------------------------------------------------
   * GRAPH CONTAINERS
   * ---------------------------------------------------------
   */

  const nodes = [];
  const edges = [];

  const nodeSeen =
    new Set();

  const edgeSeen =
    new Set();


  /*
   * ---------------------------------------------------------
   * CONTRIBUTOR
   * ---------------------------------------------------------
   */

  const contributorNodeId =
    `contributor:${contributorId}`;


  addNode(
    nodes,
    nodeSeen,
    {
      id: contributorNodeId,
      type: 'Contributor',
      label: contributorId
    }
  );


  /*
   * ---------------------------------------------------------
   * CONTRIBUTIONS + EVIDENCE
   * ---------------------------------------------------------
   */

  for (const contribution of contributions) {

    const contributionNodeId =
      `knowledge-contribution:${contribution.contributionId}`;


    addNode(
      nodes,
      nodeSeen,
      {
        id: contributionNodeId,

        type: 'KnowledgeContribution',

        label:
          contribution.title ||
          contribution.contributionId,

        properties: {

          contributionId:
            contribution.contributionId,

          category:
            contribution.category || null,

          description:
            contribution.description || null,

          status:
            contribution.status || null,

          reference:
            contribution.reference || null,

          reviewerId:
            contribution.reviewerId || null,

          reviewedAt:
            contribution.reviewedAt || null,

          rewardId:
            contribution.rewardId || null,

          rewardedAt:
            contribution.rewardedAt || null,

          ledgerReference:
            contribution.ledgerReference || null
        }
      }
    );


    addEdge(
      edges,
      edgeSeen,
      {
        from: contributorNodeId,
        to: contributionNodeId,
        type: 'CONTRIBUTED'
      }
    );


    if (contribution.reference) {

      const evidenceNodeId =
        `evidence:${contribution.contributionId}`;


      addNode(
        nodes,
        nodeSeen,
        {
          id: evidenceNodeId,

          type: 'Evidence',

          label:
            contribution.reference,

          properties: {
            reference:
              contribution.reference
          }
        }
      );


      addEdge(
        edges,
        edgeSeen,
        {
          from: contributionNodeId,
          to: evidenceNodeId,
          type: 'EVIDENCED_BY'
        }
      );
    }
  }


  /*
   * ---------------------------------------------------------
   * KNOWLEDGE + CLAIMS
   * ---------------------------------------------------------
   */

  for (const claim of knowledgeClaims) {

    const conceptKey =
      getClaimConceptKey(claim);


    if (!conceptKey) continue;


    const concept =
      conceptByKey.get(
        String(conceptKey)
      );


    const knowledgeNodeId =
      `knowledge:${conceptKey}`;


    addNode(
      nodes,
      nodeSeen,
      {
        id: knowledgeNodeId,

        type: 'Knowledge',

        label:
          getConceptLabel(
            concept,
            conceptKey
          ),

        properties: {

          conceptKey,

          conceptId:
            concept?.conceptId || null,

          slug:
            concept?.slug || null,

          category:
            concept?.category || null,

          description:
            concept?.description || null,

          aliases:
            concept?.aliases || [],

          conceptStatus:
            concept?.status || null
        }
      }
    );


    /*
     * Contribution -> Knowledge
     */

    if (claim.contributionId) {

      const contributionNodeId =
        `knowledge-contribution:${claim.contributionId}`;


      addEdge(
        edges,
        edgeSeen,
        {
          from:
            contributionNodeId,

          to:
            knowledgeNodeId,

          type:
            'DEMONSTRATES',

          properties: {

            claimId:
              claim.claimId ||
              String(claim._id),

            status:
              claim.status || null,

            relation:
              claim.relation ||
              'DEMONSTRATES',

            evidenceReference:
              claim.evidenceReference || null,

            reviewerId:
              claim.reviewerId || null,

            observedAt:
              claim.observedAt ||
              claim.createdAt ||
              null
          }
        }
      );
    }


    /*
     * Contributor -> Knowledge
     */

    addEdge(
      edges,
      edgeSeen,
      {
        from:
          contributorNodeId,

        to:
          knowledgeNodeId,

        type:
          'HAS_DEMONSTRATED_KNOWLEDGE',

        properties: {
          status:
            claim.status || null
        }
      }
    );
  }


  /*
   * ---------------------------------------------------------
   * ATTESTATIONS
   * ---------------------------------------------------------
   */

  for (const attestation of attestations) {

    const contributionNodeId =
      `knowledge-contribution:${attestation.contributionId}`;


    const attestationNodeId =
      `attestation:${String(attestation._id)}`;


    addNode(
      nodes,
      nodeSeen,
      {
        id:
          attestationNodeId,

        type:
          'Attestation',

        label:
          `${
            attestation.verifier ||
            'unknown'
          }:${
            attestation.status ||
            'unknown'
          }`,

        properties: {

          evidenceType:
            attestation.evidenceType || null,

          evidenceReference:
            attestation.evidenceReference || null,

          verifier:
            attestation.verifier || null,

          verificationMethod:
            attestation.verificationMethod || null,

          evidenceHash:
            attestation.evidenceHash || null,

          status:
            attestation.status || null,

          observedAt:
            attestation.observedAt || null
        }
      }
    );


    addEdge(
      edges,
      edgeSeen,
      {
        from:
          contributionNodeId,

        to:
          attestationNodeId,

        type:
          'ATTESTED_BY'
      }
    );
  }


  /*
   * ---------------------------------------------------------
   * REWARDS
   * ---------------------------------------------------------
   */

  for (const reward of rewards) {

    const contributionId =
      reward.metadata?.contributionId;


    if (!contributionId) continue;


    const contributionNodeId =
      `knowledge-contribution:${contributionId}`;


    const rewardNodeId =
      `reward:${
        reward.rewardId ||
        String(reward._id)
      }`;


    addNode(
      nodes,
      nodeSeen,
      {
        id:
          rewardNodeId,

        type:
          'Reward',

        label:
          `${reward.amount} ${
            reward.currency || 'MYZ'
          }`,

        properties: {

          rewardId:
            reward.rewardId || null,

          amount:
            reward.amount,

          currency:
            reward.currency || null,

          status:
            reward.status || null,

          reviewedBy:
            reward.reviewedBy || null,

          paidAt:
            reward.paidAt || null,

          ledgerReference:
            reward.metadata
              ?.ledgerReference || null
        }
      }
    );


    addEdge(
      edges,
      edgeSeen,
      {
        from:
          contributionNodeId,

        to:
          rewardNodeId,

        type:
          'REWARDED_BY'
      }
    );
  }


  /*
   * ---------------------------------------------------------
   * SETTLEMENTS
   * ---------------------------------------------------------
   */

  for (const settlement of settlements) {

    if (!settlement.rewardId) continue;


    const rewardNodeId =
      `reward:${settlement.rewardId}`;


    const settlementNodeId =
      `settlement:${settlement.settlementId}`;


    addNode(
      nodes,
      nodeSeen,
      {
        id:
          settlementNodeId,

        type:
          'Settlement',

        label:
          `${settlement.amount} ${
            settlement.asset || ''
          }`.trim(),

        properties: {

          settlementId:
            settlement.settlementId,

          contributorId:
            settlement.contributorId,

          contributionId:
            settlement.contributionId,

          rewardId:
            settlement.rewardId,

          network:
            settlement.network,

          asset:
            settlement.asset,

          amount:
            settlement.amount,

          status:
            settlement.status,

          privacyMode:
            settlement.privacyMode || null,

          proofType:
            settlement.proofType || null,

          transactionReference:
            settlement.transactionReference || null,

          txProof:
            settlement.txProof || null,

          settledAt:
            settlement.settledAt || null
        }
      }
    );


    addEdge(
      edges,
      edgeSeen,
      {
        from:
          rewardNodeId,

        to:
          settlementNodeId,

        type:
          'SETTLED_BY',

        properties: {
          network:
            settlement.network,

          asset:
            settlement.asset,

          status:
            settlement.status,

          proofType:
            settlement.proofType || null
        }
      }
    );
  }


  /*
   * ---------------------------------------------------------
   * SUMMARY
   * ---------------------------------------------------------
   */

  const knowledgeNodeCount =
    nodes.filter(
      node =>
        node.type === 'Knowledge'
    ).length;


  const demonstratesEdgeCount =
    edges.filter(
      edge =>
        edge.type === 'DEMONSTRATES'
    ).length;


  const contributorKnowledgeEdgeCount =
    edges.filter(
      edge =>
        edge.type ===
        'HAS_DEMONSTRATED_KNOWLEDGE'
    ).length;


  const settlementNodeCount =
    nodes.filter(
      node =>
        node.type === 'Settlement'
    ).length;


  const settlementEdgeCount =
    edges.filter(
      edge =>
        edge.type === 'SETTLED_BY'
    ).length;


  return {

    contributorId,

    summary: {

      nodes:
        nodes.length,

      edges:
        edges.length,

      knowledgeContributions:
        contributions.length,

      knowledgeConcepts:
        knowledgeNodeCount,

      knowledgeClaims:
        knowledgeClaims.length,

      demonstratedRelationships:
        demonstratesEdgeCount,

      contributorKnowledgeRelationships:
        contributorKnowledgeEdgeCount,

      attestations:
        attestations.length,

      rewards:
        rewards.length,

      settlements:
        settlementNodeCount,

      settlementRelationships:
        settlementEdgeCount
    },

    nodes,

    edges
  };
}


module.exports = {
  getContributorKnowledgeGraph
};

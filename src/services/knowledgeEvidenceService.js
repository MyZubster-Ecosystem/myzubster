const crypto = require('crypto');
const { anchorMarketplaceEvidenceOnBase } = require('./baseMarketplaceAnchorService');

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      if (value[key] !== undefined) out[key] = canonicalize(value[key]);
      return out;
    }, {});
  }
  return value;
}

function buildKnowledgeEvidence(input = {}) {
  if (!input.subject || !input.domain || !input.claim) {
    throw new Error('subject, domain and claim are required');
  }
  return canonicalize({
    schema: 'myzubster.knowledge.evidence.v1',
    subject: String(input.subject),
    domain: String(input.domain),
    claim: String(input.claim),
    evidenceLevel: String(input.evidenceLevel || 'self-declared'),
    evidenceRefs: Array.isArray(input.evidenceRefs)
      ? input.evidenceRefs.map(item => ({
          type: String(item.type || 'reference'),
          reference: String(item.reference || '')
        })).filter(item => item.reference)
      : [],
    transfer: input.transfer ? {
      recipient: String(input.transfer.recipient || ''),
      status: String(input.transfer.status || '')
    } : null,
    version: String(input.version || '1')
  });
}

function hashKnowledgeEvidence(payload) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(canonicalize(payload)))
    .digest('hex');
}

function verifyKnowledgeEvidence(payload, expectedHash) {
  return hashKnowledgeEvidence(payload) === String(expectedHash || '').toLowerCase();
}

async function createKnowledgeEvidence(input, options = {}) {
  const payload = buildKnowledgeEvidence(input);
  const evidenceHash = hashKnowledgeEvidence(payload);
  let anchor = { status: 'NOT_REQUESTED' };

  if (options.anchor === true) {
    try {
      anchor = await anchorMarketplaceEvidenceOnBase(evidenceHash);
    } catch (error) {
      anchor = { status: 'FAILED', error: error.message };
    }
  }

  return {
    payload,
    evidenceHash,
    algorithm: 'sha256',
    commitment: `MZ-KNOWLEDGE-V1:${evidenceHash}`,
    anchor
  };
}

module.exports = {
  canonicalize,
  buildKnowledgeEvidence,
  hashKnowledgeEvidence,
  verifyKnowledgeEvidence,
  createKnowledgeEvidence
};

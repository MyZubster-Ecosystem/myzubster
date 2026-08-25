const crypto = require('crypto');
const { buildNftLocationMetadata } = require('./locationPrivacyService');
const { canonicalJson, sha256Canonical } = require('./canonicalJsonService');

function plain(value) {
  return value && typeof value.toObject === 'function' ? value.toObject() : value || {};
}

function latestPlan(site) {
  const plans = Array.isArray(site.aiPlans) ? site.aiPlans : [];
  return plans.length ? plain(plans[plans.length - 1]) : null;
}

function areaBand(areaSqm) {
  if (areaSqm < 100) return 'micro';
  if (areaSqm < 500) return 'small';
  if (areaSqm < 2000) return 'medium';
  if (areaSqm < 10000) return 'large';
  return 'landscape';
}

function assertSafeKeys(value, path = 'metadata') {
  if (Array.isArray(value)) return value.forEach((item, index) => assertSafeKeys(item, `${path}[${index}]`));
  if (!value || typeof value !== 'object') return;
  const forbidden = /^(lat|lng|latitude|longitude|coordinates|address|owner|wallet)$/i;
  for (const [key, child] of Object.entries(value)) {
    if (forbidden.test(key)) throw new Error(`Unsafe NFT metadata key: ${path}.${key}`);
    assertSafeKeys(child, `${path}.${key}`);
  }
}

function buildPermacultureNftMetadata(site) {
  const source = plain(site);
  const profile = plain(source.profile);
  const plan = latestPlan(source);
  if (!plan) {
    const error = new Error('An AI permaculture plan is required before preparing NFT metadata');
    error.code = 'PERMACULTURE_PLAN_REQUIRED';
    throw error;
  }
  const privateLocation = plain(source.privateLocation);
  const location = buildNftLocationMetadata(source.location, privateLocation);
  const designCommitment = sha256Canonical({
    inputCommitment: plan.inputCommitment,
    zones: plan.zones,
    waterStrategy: plan.waterStrategy,
    soilStrategy: plan.soilStrategy,
    biodiversityStrategy: plan.biodiversityStrategy,
    risks: plan.risks
  });
  const metadata = {
    schemaVersion: 'myzubster-permaculture-nft-v1',
    name: `MyZubster Permaculture Design ${source.siteId}`,
    description: 'Privacy-safe provenance record for a human-reviewed permaculture design.',
    attributes: [
      { trait_type: 'Site type', value: source.siteType },
      { trait_type: 'Area band', value: areaBand(Number(profile.areaSqm) || 0) },
      { trait_type: 'Climate zone', value: profile.climateZone },
      { trait_type: 'Soil texture', value: profile.soilTexture },
      { trait_type: 'Plan version', value: plan.schemaVersion },
      { trait_type: 'Human review required', value: true },
      { trait_type: 'On-chain', value: false }
    ],
    properties: {
      siteId: source.siteId,
      goals: Array.isArray(profile.goals) ? [...profile.goals].sort() : [],
      location,
      commitments: {
        planningInput: plan.inputCommitment,
        design: designCommitment
      }
    }
  };
  assertSafeKeys(metadata);
  const metadataHash = sha256Canonical(metadata);
  return { metadata, metadataHash, canonical: canonicalJson(metadata) };
}

function simulatePermacultureNft(metadataHash, options = {}) {
  const mode = options.mode || process.env.NFT_MINT_MODE || 'disabled';
  if (mode !== 'simulation') {
    const error = new Error('On-chain NFT runtime is not configured');
    error.code = 'NFT_RUNTIME_NOT_CONFIGURED';
    throw error;
  }
  return {
    state: 'simulated',
    onChain: false,
    tokenId: BigInt(`0x${crypto.randomBytes(16).toString('hex')}`).toString(10),
    metadataHash,
    transactionHash: null,
    chain: null,
    contractAddress: null
  };
}

module.exports = {
  buildPermacultureNftMetadata,
  simulatePermacultureNft,
  assertSafeKeys
};

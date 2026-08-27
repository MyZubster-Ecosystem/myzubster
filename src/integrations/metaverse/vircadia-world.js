'use strict';

/**
 * Experimental Vircadia World adapter metadata and MyZubster-side draft mapper.
 *
 * This adapter does not imply partnership or endorsement by Vircadia.
 * External authentication remains external and third-party assets are
 * reference-only unless their licenses explicitly permit reuse.
 *
 * The `VircadiaEntityDraft` shape intentionally stays independent from the
 * current Vircadia transport schema. A transport layer can map this stable
 * MyZubster-side representation to the exact SDK/API payload after runtime
 * verification against a pinned Vircadia World version.
 */
const vircadiaWorldAdapter = Object.freeze({
  id: 'vircadia-world',
  name: 'Vircadia World',
  type: 'external_metaverse',
  status: 'experimental',
  upstream: 'https://github.com/vircadia/vircadia-world',
  upstreamCommit: '9f185373ac89fb5834fda238fa83f51d1d6851a9',
  sdk: 'https://github.com/vircadia/vircadia-world-sdk-ts',
  sdkBranch: 'next',
  entryUrl: null,
  authMode: 'external',
  assetPolicy: 'reference_only_unless_licensed',
  provenanceRequired: true,
  partnershipClaim: false,
  upstreamValidated: false,
});

const ALLOWED_KINDS = new Set(['place', 'plant', 'environment', 'mission']);

function getVircadiaWorldAdapter() {
  return { ...vircadiaWorldAdapter };
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function assertPublicObservation(observation) {
  if (!observation || typeof observation !== 'object' || Array.isArray(observation)) {
    throw new TypeError('Vircadia adapter requires an observation object');
  }

  if (observation.public !== true) {
    throw new Error('Vircadia adapter only accepts explicitly public/sanitized observations');
  }

  if (!observation.id || typeof observation.id !== 'string') {
    throw new Error('Observation id is required');
  }

  if (!observation.title || typeof observation.title !== 'string') {
    throw new Error('Observation title is required');
  }

  if (!ALLOWED_KINDS.has(observation.kind)) {
    throw new Error(`Unsupported Vircadia observation kind: ${String(observation.kind)}`);
  }

  const position = observation.position;
  if (
    !position ||
    !isFiniteNumber(position.x) ||
    !isFiniteNumber(position.y) ||
    !isFiniteNumber(position.z)
  ) {
    throw new Error('Observation position must contain finite x/y/z world coordinates');
  }
}

function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const blockedKeys = new Set([
    'token',
    'accessToken',
    'refreshToken',
    'authorization',
    'password',
    'privateKey',
    'seed',
    'secret',
  ]);

  const sanitized = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!blockedKeys.has(key)) {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Convert a sanitized/public MyZubster observation into a stable intermediate
 * draft for Vircadia transport code.
 *
 * Expected source shape:
 * {
 *   id, title, kind, public, verified?, sourceUrl?, syncGroup?, position, metadata?
 * }
 */
function toVircadiaEntityDraft(observation, options = {}) {
  assertPublicObservation(observation);

  const syncGroup =
    options.syncGroup || observation.syncGroup || 'myzubster-public-demo';

  if (typeof syncGroup !== 'string' || syncGroup.trim().length === 0) {
    throw new Error('A non-empty syncGroup is required');
  }

  return {
    sourceId: observation.id,
    entityName: `myz-${observation.id}`,
    syncGroup,
    transform: {
      position: {
        x: observation.position.x,
        y: observation.position.y,
        z: observation.position.z,
      },
    },
    display: {
      title: observation.title,
      kind: observation.kind,
    },
    provenance: {
      source: 'MyZubster',
      sourceUrl:
        typeof observation.sourceUrl === 'string' && observation.sourceUrl.length > 0
          ? observation.sourceUrl
          : undefined,
      public: true,
      verified: observation.verified === true,
    },
    metadata: sanitizeMetadata(observation.metadata),
  };
}

module.exports = {
  ALLOWED_KINDS,
  vircadiaWorldAdapter,
  getVircadiaWorldAdapter,
  assertPublicObservation,
  sanitizeMetadata,
  toVircadiaEntityDraft,
};

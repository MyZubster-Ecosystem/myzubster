'use strict';

/**
 * Experimental Vircadia World adapter metadata.
 *
 * This adapter does not imply partnership or endorsement by Vircadia.
 * External authentication remains external and third-party assets are
 * reference-only unless their licenses explicitly permit reuse.
 */
const vircadiaWorldAdapter = Object.freeze({
  id: 'vircadia-world',
  name: 'Vircadia World',
  type: 'external_metaverse',
  status: 'experimental',
  upstream: 'https://github.com/vircadia/vircadia-world',
  entryUrl: null,
  authMode: 'external',
  assetPolicy: 'reference_only_unless_licensed',
  provenanceRequired: true,
  partnershipClaim: false,
  upstreamValidated: false,
});

function getVircadiaWorldAdapter() {
  return { ...vircadiaWorldAdapter };
}

module.exports = {
  vircadiaWorldAdapter,
  getVircadiaWorldAdapter,
};

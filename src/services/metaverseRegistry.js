// Metadata only. MyZubster never stores seed phrases/private keys and never executes swaps here.
const WORLDS = Object.freeze({
  decentraland: {
    id: 'decentraland', name: 'Decentraland', token: 'MANA', network: 'ethereum',
    homepage: 'https://decentraland.org/', walletMode: 'evm-signature', status: 'supported'
  },
  sandbox: {
    id: 'sandbox', name: 'The Sandbox', token: 'SAND', network: 'polygon/ethereum/base',
    homepage: 'https://www.sandbox.game/', walletMode: 'evm-signature', status: 'supported'
  }
});

function listWorlds() { return Object.values(WORLDS); }
function getWorld(id) { return WORLDS[String(id || '').toLowerCase()] || null; }

module.exports = { listWorlds, getWorld };

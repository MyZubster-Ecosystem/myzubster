// Metadata only. MyZubster never stores seed phrases/private keys and never executes swaps here.
const WORLDS = Object.freeze({
  decentraland: {
    id: 'decentraland', name: 'Decentraland', token: 'MANA', network: 'ethereum',
    homepage: 'https://decentraland.org/', walletMode: 'evm-signature', status: 'supported',
    portfolio: {
      chain: 'ethereum', rpcEnv: 'ETHEREUM_RPC_URL', decimals: 18,
      tokenContract: process.env.MANA_TOKEN_CONTRACT || '0x0f5d2fb29fb7d3cfee444a200298f468908cc942'
    }
  },
  sandbox: {
    id: 'sandbox', name: 'The Sandbox', token: 'SAND', network: 'polygon/ethereum/base',
    homepage: 'https://www.sandbox.game/', walletMode: 'evm-signature', status: 'supported',
    portfolio: {
      chain: 'ethereum', rpcEnv: 'ETHEREUM_RPC_URL', decimals: 18,
      tokenContract: process.env.SAND_TOKEN_CONTRACT || '0x3845badade8e6dff049820680d1f14bd3903a5d0'
    }
  }
});

function listWorlds() {
  return Object.values(WORLDS).map(world => ({
    ...world,
    portfolio: { ...world.portfolio, configured: Boolean(process.env[world.portfolio.rpcEnv]) }
  }));
}
function getWorld(id) { return WORLDS[String(id || '').toLowerCase()] || null; }

module.exports = { listWorlds, getWorld };

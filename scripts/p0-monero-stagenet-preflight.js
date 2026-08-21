'use strict';

const { createMoneroWalletRpcClient } = require('../src/services/moneroWalletRpcClient');

async function main() {
  const url = process.env.P0_MONERO_STAGENET_WALLET_RPC_URL;
  if (!url) throw new Error('P0_MONERO_STAGENET_WALLET_RPC_URL is required');

  const rpc = createMoneroWalletRpcClient({ url });
  const version = await rpc.call('get_version');
  const height = await rpc.call('get_height');
  const balance = await rpc.call('get_balance', { account_index: 0 });

  const unlockedBalance = String(balance?.unlocked_balance ?? '0');
  const totalBalance = String(balance?.balance ?? '0');

  console.log(JSON.stringify({
    ok: true,
    network: 'stagenet',
    walletRpcVersion: version?.version ?? null,
    walletHeight: height?.height ?? null,
    balanceAtomic: totalBalance,
    unlockedBalanceAtomic: unlockedBalance,
    relayGuard: 'disabled-by-default',
  }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

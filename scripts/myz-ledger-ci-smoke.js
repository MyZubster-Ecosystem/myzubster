'use strict';

const fs = require('fs');

const ledger = JSON.parse(fs.readFileSync('myz/ledger.json', 'utf8'));

if (ledger.schema !== 'myzubster-myz-ledger/v1') throw new Error('invalid MYZ ledger schema');
if (ledger.asset !== 'MYZ') throw new Error('asset must be MYZ');
if (ledger.asset_type !== 'internal-reward-accounting-unit') throw new Error('unexpected MYZ asset_type');
if (ledger.on_chain !== false) throw new Error('canonical MYZ v1 ledger must remain off-chain');

console.log(JSON.stringify({
  schema: 'myzubster-myz-ledger-ci-smoke/v1',
  ok: true,
  asset: ledger.asset,
  assetType: ledger.asset_type,
  onChain: ledger.on_chain
}, null, 2));

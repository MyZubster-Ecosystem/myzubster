'use strict';

const fs = require('fs');
const path = require('path');

describe('Marketplace ETH Sepolia real-wallet E2E harness', () => {
  const workflow = fs.readFileSync(
    path.join(__dirname, '../.github/workflows/marketplace-eth-sepolia-e2e.yml'),
    'utf8'
  );
  const verifier = fs.readFileSync(
    path.join(__dirname, '../scripts/verify-marketplace-eth-sepolia-e2e.js'),
    'utf8'
  );
  const runbook = fs.readFileSync(
    path.join(__dirname, '../docs/marketplace/ETH-SEPOLIA-REAL-WALLET-E2E.md'),
    'utf8'
  );

  test('workflow is manual and verifies public chain evidence only', () => {
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('ETH_SEPOLIA_RPC_URL: ${{ secrets.ETH_SEPOLIA_RPC_URL }}');
    expect(workflow).toContain('MYZ_E2E_TX_HASH');
    expect(workflow).toContain('MYZ_E2E_EXPECTED_SENDER');
    expect(workflow).toContain('MYZ_E2E_EXPECTED_RECIPIENT');
    expect(workflow).toContain('MYZ_E2E_EXPECTED_AMOUNT_WEI');
    expect(workflow).not.toMatch(/PRIVATE_KEY|SEED|MNEMONIC/i);
  });

  test('independent verifier records a hashed evidence artifact', () => {
    expect(verifier).toContain('verifyEthereumSepoliaPayment');
    expect(verifier).toContain('marketplace-eth-sepolia-e2e-evidence.json');
    expect(verifier).toContain("schema:'myzubster.marketplace-eth-sepolia-e2e/v1'");
    expect(verifier).toContain("createHash('sha256')");
    expect(verifier).not.toMatch(/privateKey|seedPhrase|mnemonic/i);
  });

  test('runbook requires real MetaMask approval and keeps Mainnet out of scope', () => {
    expect(runbook).toContain('real Buyer MetaMask approval');
    expect(runbook).toContain('MyZubster PAID transition');
    expect(runbook).toContain('independent verifier PASS');
    expect(runbook).toContain('Mainnet remains out of scope');
    expect(runbook).toContain('Never paste a MetaMask private key, seed phrase or mnemonic');
  });
});

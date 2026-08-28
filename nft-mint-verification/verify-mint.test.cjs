const test = require('node:test');
const assert = require('node:assert/strict');
const { ethers } = require('ethers');
const { verifyMint } = require('./verify-mint.cjs');

function mintReceipt({ contract, owner, tokenId = 1n, status = 1, to = contract }) {
  return {
    status,
    to,
    blockNumber: 123,
    hash: '0x' + '11'.repeat(32),
    logs: [{
      address: contract,
      topics: [
        ethers.id('Transfer(address,address,uint256)'),
        ethers.zeroPadValue(ethers.ZeroAddress, 32),
        ethers.zeroPadValue(owner, 32),
        ethers.zeroPadValue(ethers.toBeHex(tokenId), 32)
      ],
      data: '0x'
    }]
  };
}

test('accepts a valid ERC-721 mint receipt plus current owner/tokenURI state', async () => {
  const contract = ethers.Wallet.createRandom().address;
  const owner = ethers.Wallet.createRandom().address;
  const result = await verifyMint({
    chainId: 11155111,
    expectedChainId: 11155111,
    receipt: mintReceipt({ contract, owner }),
    contractAddress: contract,
    allowedContracts: [contract],
    ownerWallet: owner,
    tokenId: 1,
    metadataUri: 'ipfs://character-1',
    readOwnerOf: async () => owner,
    readTokenUri: async () => 'ipfs://character-1'
  });
  assert.equal(result.tokenId, '1');
  assert.equal(result.ownerWallet, owner.toLowerCase());
});

test('rejects a contract outside the allowlist', async () => {
  const contract = ethers.Wallet.createRandom().address;
  const allowed = ethers.Wallet.createRandom().address;
  const owner = ethers.Wallet.createRandom().address;
  await assert.rejects(() => verifyMint({
    chainId: 11155111,
    expectedChainId: 11155111,
    receipt: mintReceipt({ contract, owner }),
    contractAddress: contract,
    allowedContracts: [allowed],
    ownerWallet: owner,
    tokenId: 1,
    readOwnerOf: async () => owner,
    readTokenUri: async () => 'ipfs://character-1'
  }), /not allowed/);
});

test('rejects a receipt without the zero-address mint Transfer event', async () => {
  const contract = ethers.Wallet.createRandom().address;
  const owner = ethers.Wallet.createRandom().address;
  const receipt = mintReceipt({ contract, owner });
  receipt.logs[0].topics[1] = ethers.zeroPadValue(ethers.Wallet.createRandom().address, 32);
  await assert.rejects(() => verifyMint({
    chainId: 11155111,
    expectedChainId: 11155111,
    receipt,
    contractAddress: contract,
    allowedContracts: [contract],
    ownerWallet: owner,
    tokenId: 1,
    readOwnerOf: async () => owner,
    readTokenUri: async () => 'ipfs://character-1'
  }), /Transfer event not found/);
});

test('rejects chain mismatch, owner mismatch and metadata mismatch', async () => {
  const contract = ethers.Wallet.createRandom().address;
  const owner = ethers.Wallet.createRandom().address;
  const other = ethers.Wallet.createRandom().address;
  const receipt = mintReceipt({ contract, owner });

  await assert.rejects(() => verifyMint({
    chainId: 1,
    expectedChainId: 11155111,
    receipt,
    contractAddress: contract,
    allowedContracts: [contract],
    ownerWallet: owner,
    tokenId: 1,
    readOwnerOf: async () => owner,
    readTokenUri: async () => 'ipfs://character-1'
  }), /chainId mismatch/);

  await assert.rejects(() => verifyMint({
    chainId: 11155111,
    expectedChainId: 11155111,
    receipt,
    contractAddress: contract,
    allowedContracts: [contract],
    ownerWallet: owner,
    tokenId: 1,
    readOwnerOf: async () => other,
    readTokenUri: async () => 'ipfs://character-1'
  }), /owner mismatch/);

  await assert.rejects(() => verifyMint({
    chainId: 11155111,
    expectedChainId: 11155111,
    receipt,
    contractAddress: contract,
    allowedContracts: [contract],
    ownerWallet: owner,
    tokenId: 1,
    metadataUri: 'ipfs://expected',
    readOwnerOf: async () => owner,
    readTokenUri: async () => 'ipfs://different'
  }), /metadata URI mismatch/);
});

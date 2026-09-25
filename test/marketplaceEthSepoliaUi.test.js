'use strict';

const fs = require('fs');
const path = require('path');

describe('Marketplace Sepolia ETH payment UI', () => {
  const page = fs.readFileSync(
    path.join(__dirname, '../frontend/src/pages/MarketplaceOpsPage.js'),
    'utf8'
  );

  test('requires explicit MetaMask transaction confirmation on Sepolia', () => {
    expect(page).toContain("method:'eth_requestAccounts'");
    expect(page).toContain("method:'eth_chainId'");
    expect(page).toContain("method:'wallet_switchEthereumChain'");
    expect(page).toContain("method:'eth_sendTransaction'");
    expect(page).toContain("Paga ETH su Sepolia · testnet");
    expect(page).toContain("Questa è una transazione blockchain testnet e richiede conferma esplicita in MetaMask.");
  });

  test('keeps submitted ETH payment separate from verified PAID state', () => {
    expect(page).toContain("Verifica conferme ETH");
    expect(page).toContain("Pagamento ETH verificato su Sepolia");
    expect(page).toContain("lo stato <strong>PAID</strong> viene assegnato solo dopo verifica server-side");
    expect(page).toContain("https://sepolia.etherscan.io/tx/");
  });

  test('renders Seller and Buyer actions according to participant role', () => {
    expect(page).toContain("order.status === 'REQUESTED' && order.viewerRole === 'SELLER'");
    expect(page).toContain("order.status === 'REQUESTED' && order.viewerRole === 'BUYER'");
    expect(page).toContain("order.status === 'ACCEPTED' && order.viewerRole === 'SELLER'");
  });
});

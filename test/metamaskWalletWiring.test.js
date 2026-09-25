const fs=require('fs');
const path=require('path');

describe('MetaMask wallet API and UI wiring',()=>{
  const server=fs.readFileSync(path.join(__dirname,'..','server.js'),'utf8');
  const routes=fs.readFileSync(path.join(__dirname,'..','src','routes','evmWalletRoutes.js'),'utf8');
  const user=fs.readFileSync(path.join(__dirname,'..','src','models','User.js'),'utf8');
  const ui=fs.readFileSync(path.join(__dirname,'..','frontend','src','components','WalletHubPanel.js'),'utf8');

  test('mounts the authenticated wallet API behind the database gate',()=>{
    expect(server).toContain("app.use('/api/wallet',requireDatabase)");
    expect(server).toContain("app.use('/api/wallet',evmWalletRoutes)");
    expect(routes).toContain("router.post('/challenge', authenticate");
    expect(routes).toContain("router.post('/verify', authenticate");
    expect(routes).toContain("router.delete('/disconnect', authenticate");
  });

  test('stores only wallet relationship and hidden challenge metadata',()=>{
    expect(user).toContain("evmWallet:");
    expect(user).toContain("WALLET_CHALLENGE_PENDING");
    expect(user).toContain("WALLET_VERIFIED");
    expect(user).toContain("linkChallenge: { type: evmWalletChallengeSchema, select: false");
    expect(user).not.toMatch(/privateKey|seedPhrase|mnemonic/i);
  });

  test('connects through MetaMask message signing without payment semantics',()=>{
    expect(ui).toContain("'eth_requestAccounts'");
    expect(ui).toContain("'eth_chainId'");
    expect(ui).toContain("'personal_sign'");
    expect(ui).toContain("/api/wallet/challenge");
    expect(ui).toContain("/api/wallet/verify");
    expect(ui).toContain("non autorizza un pagamento");
    expect(ui).toContain("non spende ETH");
  });
});

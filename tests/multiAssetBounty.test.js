const BountyConfig = require('../src/models/bountyConfigModel');

describe('multi-asset bounty rewards', () => {
  const base = {
    issueNumber: 999001,
    repository: 'MyZubster-Ecosystem/myzubster',
    rewardAmount: 100,
    currency: 'MULTI'
  };

  test.each([
    [['MYZ']],
    [['XMR']],
    [['TOKEN']],
    [['MYZ', 'XMR']],
    [['MYZ', 'TOKEN']],
    [['XMR', 'TOKEN']],
    [['MYZ', 'XMR', 'TOKEN']]
  ])('accepts reward combination %j', async assets => {
    const rewardComponents = assets.map((asset, index) => ({
      asset,
      amount: String(index + 1),
      ...(asset === 'TOKEN' ? { network: 'chain-1', contractAddress: '0xToken' } : {})
    }));
    const bounty = new BountyConfig({ ...base, issueNumber: 999001 + assets.length, rewardComponents });
    await expect(bounty.validate()).resolves.toBeUndefined();
  });

  test('rejects duplicate assets', async () => {
    const bounty = new BountyConfig({
      ...base,
      rewardComponents: [
        { asset: 'MYZ', amount: '10' },
        { asset: 'MYZ', amount: '20' }
      ]
    });
    await expect(bounty.validate()).rejects.toThrow(/each asset at most once/i);
  });

  test('rejects token reward without network and contract', async () => {
    const bounty = new BountyConfig({
      ...base,
      rewardComponents: [{ asset: 'TOKEN', amount: '10' }]
    });
    await expect(bounty.validate()).rejects.toThrow(/TOKEN rewards require network and contractAddress/i);
  });

  test('stores canonical token amount as a string', async () => {
    const bounty = new BountyConfig({
      ...base,
      rewardComponents: [{
        asset: 'TOKEN',
        amount: '1000000000000000001',
        network: 'chain-1',
        contractAddress: '0xToken'
      }]
    });
    await bounty.validate();
    expect(bounty.rewardComponents[0].amount).toBe('1000000000000000001');
  });

  test('wallet is stored per reward component', async () => {
    const bounty = new BountyConfig({
      ...base,
      rewardComponents: [
        { asset: 'MYZ', amount: '10', walletAddress: 'myz-wallet' },
        { asset: 'XMR', amount: '0.1', walletAddress: 'xmr-wallet' },
        { asset: 'TOKEN', amount: '25', network: 'chain-1', contractAddress: '0xToken', walletAddress: 'token-wallet' }
      ]
    });
    await bounty.validate();
    expect(bounty.rewardComponents.map(component => component.walletAddress)).toEqual([
      'myz-wallet',
      'xmr-wallet',
      'token-wallet'
    ]);
  });
});

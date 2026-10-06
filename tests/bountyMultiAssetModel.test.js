const mongoose = require('mongoose');
const Bounty = require('../src/models/Bounty');

function makeBounty(overrides = {}) {
  return new Bounty({
    title: 'Multi asset bounty',
    description: 'Settlement safety test',
    issueNumber: Math.floor(Math.random() * 1000000) + 1,
    issueUrl: 'https://example.test/issues/1',
    repository: 'myzubster',
    amount: 10,
    createdBy: new mongoose.Types.ObjectId(),
    rewardComponents: [{ asset: 'MYZ', amount: '10', status: 'ready' }],
    ...overrides
  });
}

describe('Bounty multi-asset settlement gates', () => {
  test('preserves Mongoose document model', () => {
    const bounty = makeBounty();
    expect(bounty).toBeInstanceOf(mongoose.Model);
    expect(typeof bounty.save).toBe('function');
  });

  test('rejects duplicate assets', async () => {
    const bounty = makeBounty({ rewardComponents: [
      { asset: 'MYZ', amount: '5' },
      { asset: 'MYZ', amount: '5' }
    ] });
    await expect(bounty.validate()).rejects.toThrow('rewardComponents must contain each asset at most once');
  });

  test('requires TOKEN network and contract', async () => {
    const bounty = makeBounty({ rewardComponents: [{ asset: 'TOKEN', amount: '1', status: 'pending' }] });
    await expect(bounty.validate()).rejects.toThrow('TOKEN rewards require network and contractAddress');
  });

  test('forbids confirming without independent verification reference', () => {
    const bounty = makeBounty();
    bounty.recordRewardSubmission('MYZ', { walletAddress: 'wallet', txId: 'tx-1', network: 'Tari' });
    expect(() => bounty.confirmRewardSettlement('MYZ')).toThrow('independent sourceReference is required');
  });

  test('requires submit -> confirm -> paid and keeps selected asset explicit', () => {
    const bounty = makeBounty({ rewardComponents: [
      { asset: 'MYZ', amount: '5', status: 'ready' },
      { asset: 'XMR', amount: '0.1', status: 'pending', network: 'stagenet' }
    ] });

    expect(() => bounty.recordRewardSubmission('TOKEN', { walletAddress: 'w', txId: 'tx' }))
      .toThrow('TOKEN is not declared on this bounty');

    bounty.recordRewardSubmission('XMR', { walletAddress: 'xmr-wallet', txId: 'xmr-tx', network: 'stagenet' });
    bounty.confirmRewardSettlement('XMR', { sourceReference: 'verifier://xmr-tx' });
    bounty.markRewardPaid('XMR');

    expect(bounty.getRewardComponent('XMR').status).toBe('paid');
    expect(bounty.getRewardComponent('XMR').sourceReference).toBe('verifier://xmr-tx');
  });
});

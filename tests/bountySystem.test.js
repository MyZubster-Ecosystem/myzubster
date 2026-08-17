const mockBountyConfig = {
  findOne: jest.fn(),
  find: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
};

jest.mock('../src/models/bountyConfigModel', () => mockBountyConfig);
jest.mock('axios', () => ({ post: jest.fn() }));

const axios = require('axios');
const controller = require('../src/controllers/bountySystemController');
const { PAYMENT_STATES, processPayment, transition } = require('../src/services/paymentLifecycle');

function response() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe('bounty system', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('routes module loads after the bounty feature is enabled', () => {
    expect(typeof require('../src/routes/bountySystemRoutes')).toBe('function');
  });

  test('create rejects an incomplete bounty request', async () => {
    const res = response();
    await controller.createBounty({ body: { issueNumber: 289 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'issueNumber and repository are required' });
  });

  test('merge webhook ignores non-merge events', async () => {
    const res = response();
    await controller.processMerge({
      headers: { 'x-github-event': 'pull_request' },
      body: { action: 'opened', pull_request: { merged: false } },
    }, res);
    expect(res.json).toHaveBeenCalledWith({ message: 'Ignored: PR not merged' });
    expect(mockBountyConfig.findOne).not.toHaveBeenCalled();
  });

  test('merged PR fails closed before submission without an independent verifier', async () => {
    const bounty = {
      status: 'open',
      paymentStatus: 'PENDING',
      paymentRecipient: '12abc',
      paymentAsset: 'MYZ',
      paymentNetwork: 'Tari',
      issueNumber: 289,
      rewardAmount: 25,
      currency: 'MYZ',
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockBountyConfig.findOne.mockResolvedValue(bounty);
    const res = response();

    await controller.processMerge({
      headers: { 'x-github-event': 'pull_request' },
      body: {
        action: 'closed',
        pull_request: { merged: true, number: 300, body: 'Fixes #289', user: { login: 'contributor' } },
        repository: { full_name: 'MyZubster-Ecosystem/myzubster' },
      },
    }, res);

    expect(axios.post).not.toHaveBeenCalled();
    expect(bounty.status).toBe('completed');
    expect(bounty.paymentStatus).toBe('FAILED');
    expect(bounty.claimedBy).toBe('contributor');
    expect(bounty.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      contributor: 'contributor',
      prNumber: 300,
      bountiesProcessed: [{ issueNumber: 289, rewardAmount: 25, paymentStatus: 'FAILED', error: 'payment verifier is not configured' }],
    }));
  });

  test('missing verifier takes precedence over gateway submission', async () => {
    const bounty = {
      status: 'open', paymentStatus: 'PENDING', paymentRecipient: '12abc',
      paymentAsset: 'MYZ', paymentNetwork: 'Tari', issueNumber: 289,
      rewardAmount: 10, currency: 'MYZ', save: jest.fn().mockResolvedValue(undefined),
    };
    mockBountyConfig.findOne.mockResolvedValue(bounty);
    const res = response();

    await controller.processMerge({
      headers: { 'x-github-event': 'pull_request' },
      body: {
        action: 'closed',
        pull_request: { merged: true, number: 301, body: 'Closes #289', user: { login: 'contributor' } },
        repository: { full_name: 'MyZubster-Ecosystem/myzubster' },
      },
    }, res);

    expect(bounty.status).toBe('completed');
    expect(bounty.paymentStatus).toBe('FAILED');
    expect(axios.post).not.toHaveBeenCalled();
    expect(bounty.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      bountiesProcessed: [expect.objectContaining({ issueNumber: 289, error: 'payment verifier is not configured' })],
    }));
  });

  test('rejects invalid lifecycle transitions', () => {
    expect(() => transition(PAYMENT_STATES.CONFIRMED, PAYMENT_STATES.SUBMITTED)).toThrow('Invalid payment transition');
  });

  test('does not confirm simulated adapter responses', async () => {
    const bounty = { paymentStatus: 'PENDING', paymentRecipient: '12abc', paymentAsset: 'MYZ', paymentNetwork: 'Tari', rewardAmount: 25 };
    const result = await processPayment({ bounty, adapter: { submit: jest.fn().mockResolvedValue({ simulated: true }) }, verifier: { verify: jest.fn() } });
    expect(result.state).toBe('FAILED');
    expect(bounty.paymentStatus).toBe('FAILED');
  });

  test('reconciles a submitted payment without submitting twice', async () => {
    const bounty = { paymentStatus: 'SUBMITTED', paymentTxId: 'tx-1', paymentRecipient: '12abc', paymentAsset: 'MYZ', paymentNetwork: 'Tari', rewardAmount: 25 };
    const adapter = { submit: jest.fn() };
    const verifier = { verify: jest.fn().mockResolvedValue({
      valid: true, txId: 'tx-1', recipient: '12abc', asset: 'MYZ', network: 'Tari', amount: 25,
      transactionStatus: 'confirmed', checks: { recipient: true, asset: true, network: true, amount: true, transactionStatus: true },
    }) };
    const result = await processPayment({ bounty, adapter, verifier });
    expect(result.state).toBe('CONFIRMED');
    expect(adapter.submit).not.toHaveBeenCalled();
    expect(bounty.status).toBe('paid');
  });

  test('does not confirm a verifier result with a false field check', async () => {
    const bounty = { paymentStatus: 'SUBMITTED', paymentTxId: 'tx-1', paymentRecipient: '12abc', paymentAsset: 'MYZ', paymentNetwork: 'Tari', rewardAmount: 25 };
    const verifier = { verify: jest.fn().mockResolvedValue({
      valid: true, txId: 'tx-1', recipient: '12abc', asset: 'MYZ', network: 'Tari', amount: 25,
      transactionStatus: 'confirmed', checks: { recipient: true, asset: true, network: false, amount: true, transactionStatus: true },
    }) };
    const result = await processPayment({ bounty, adapter: { submit: jest.fn() }, verifier });
    expect(result.state).toBe('FAILED');
    expect(bounty.paymentStatus).toBe('FAILED');
    expect(bounty.status).not.toBe('paid');
  });

  test('does not confirm a verifier result bound to a different transaction', async () => {
    const bounty = { paymentStatus: 'SUBMITTED', paymentTxId: 'tx-1', paymentRecipient: '12abc', paymentAsset: 'MYZ', paymentNetwork: 'Tari', rewardAmount: 25 };
    const verifier = { verify: jest.fn().mockResolvedValue({
      valid: true, txId: 'tx-2', recipient: '12abc', asset: 'MYZ', network: 'Tari', amount: 25,
      transactionStatus: 'confirmed', checks: { recipient: true, asset: true, network: true, amount: true, transactionStatus: true },
    }) };
    const result = await processPayment({ bounty, adapter: { submit: jest.fn() }, verifier });
    expect(result.state).toBe('FAILED');
    expect(bounty.paymentStatus).toBe('FAILED');
    expect(bounty.status).not.toBe('paid');
  });

  test('legacy bounty without payment recipient fails before adapter submission', async () => {
    const bounty = { paymentStatus: 'PENDING', rewardAmount: 25, currency: 'MYZ' };
    const adapter = { submit: jest.fn() };
    const verifier = { verify: jest.fn() };
    const result = await processPayment({ bounty, adapter, verifier });
    expect(result.state).toBe('FAILED');
    expect(bounty.paymentStatus).toBe('FAILED');
    expect(adapter.submit).not.toHaveBeenCalled();
    expect(verifier.verify).not.toHaveBeenCalled();
  });

  test('legacy model defaults keep payment fields nullable and pending', () => {
    const BountyConfig = jest.requireActual('../src/models/bountyConfigModel');
    const bounty = new BountyConfig({ issueNumber: 999, repository: 'example/repo' });
    expect(bounty.paymentStatus).toBe('PENDING');
    expect(bounty.paymentRecipient).toBeNull();
    expect(bounty.paymentTxId).toBeNull();
    expect(bounty.paymentNetwork).toBe('Tari');
    expect(bounty.paymentAsset).toBe('MYZ');
  });

  test('is replay-safe after confirmation', async () => {
    const bounty = { paymentStatus: 'CONFIRMED', paymentTxId: 'tx-1' };
    const adapter = { submit: jest.fn() };
    const verifier = { verify: jest.fn() };
    const result = await processPayment({ bounty, adapter, verifier });
    expect(result).toEqual({ state: 'CONFIRMED', replay: true });
    expect(adapter.submit).not.toHaveBeenCalled();
    expect(verifier.verify).not.toHaveBeenCalled();
  });
});

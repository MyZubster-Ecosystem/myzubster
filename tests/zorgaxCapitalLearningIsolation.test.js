'use strict';

const { getLearningSnapshot } = require('../src/services/zorgaxCapitalLearningService');

function queryChain(rows) {
  return {
    sort() { return this; },
    limit() { return this; },
    lean: jest.fn().mockResolvedValue(rows)
  };
}

describe('Zorgax Capital Learning isolation', () => {
  test('filters completed evidence by owner, asset and network', async () => {
    const rows = [{
      status: 'COMPLETED',
      category: 'SECURITY',
      spentMinor: 1000,
      measuredReturnMinor: 1200,
      realizedReturnBps: 2000
    }];
    const AllocationModel = {
      find: jest.fn(() => queryChain(rows))
    };

    const snapshot = await getLearningSnapshot({
      AllocationModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'btc',
      network: 'mainnet'
    });

    expect(AllocationModel.find).toHaveBeenCalledWith({
      ownerId: 'myzubster-ecosystem',
      status: 'COMPLETED',
      asset: 'BTC',
      network: 'mainnet'
    });
    expect(snapshot.asset).toBe('BTC');
    expect(snapshot.network).toBe('mainnet');
    expect(snapshot.guardrails.isolatesAsset).toBe(true);
    expect(snapshot.guardrails.isolatesNetworkWhenSpecified).toBe(true);
  });

  test('does not add a network filter when network is intentionally omitted', async () => {
    const AllocationModel = {
      find: jest.fn(() => queryChain([]))
    };

    await getLearningSnapshot({
      AllocationModel,
      ownerId: 'myzubster-ecosystem',
      asset: 'BTC'
    });

    expect(AllocationModel.find).toHaveBeenCalledWith({
      ownerId: 'myzubster-ecosystem',
      status: 'COMPLETED',
      asset: 'BTC'
    });
  });
});

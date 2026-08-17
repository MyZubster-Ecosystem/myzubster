const SUPPORTED_ASSETS = new Set(['MYZ', 'XMR', 'TOKEN']);

function normalizeRewardComponents(rewardComponents, legacyAmount, legacyCurrency = 'MYZ') {
  const source = rewardComponents?.length
    ? rewardComponents
    : [{ asset: legacyCurrency, amount: legacyAmount }];

  const seen = new Set();
  return source.map(component => {
    if (!component || !SUPPORTED_ASSETS.has(component.asset)) {
      throw new Error('Unsupported reward asset');
    }
    if (seen.has(component.asset)) {
      throw new Error('Each reward asset may appear only once');
    }
    seen.add(component.asset);

    const amount = String(component.amount);
    if (!/^\d+(?:\.\d+)?$/.test(amount) || Number(amount) <= 0) {
      throw new Error(`Invalid ${component.asset} reward amount`);
    }
    if (component.asset === 'TOKEN' && (!component.network || !component.contractAddress)) {
      throw new Error('TOKEN rewards require network and contractAddress');
    }

    return {
      asset: component.asset,
      amount,
      status: component.asset === 'MYZ' ? 'ready' : 'pending',
      network: component.network,
      contractAddress: component.contractAddress,
      walletAddress: component.walletAddress,
      sourceReference: component.sourceReference,
      confirmationRequirement: component.confirmationRequirement
    };
  });
}

function allComponentsPaid(components) {
  return Array.isArray(components) && components.length > 0 && components.every(component => component.status === 'paid');
}

module.exports = { SUPPORTED_ASSETS, normalizeRewardComponents, allComponentsPaid };

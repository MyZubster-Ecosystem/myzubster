const crypto = require('crypto');

function actorHash(userId) {
  if (!userId) return null;
  return crypto.createHash('sha256').update(String(userId)).digest('hex').slice(0, 16);
}

function logConversionEvent(event, {
  userId,
  path,
  provider,
  plan,
  amount,
  currency,
  metadata = {},
  logger = console
} = {}) {
  const numericAmount = amount == null ? null : Number(amount);
  const payload = {
    event,
    actor: actorHash(userId),
    path: path || null,
    provider: provider || null,
    plan: plan || null,
    amount: Number.isFinite(numericAmount) ? numericAmount : null,
    currency: currency || null,
    ...metadata
  };

  logger.info('[zorgax-funnel]', JSON.stringify(payload));
  return payload;
}

module.exports = { actorHash, logConversionEvent };

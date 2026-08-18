const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  if (!secret || !signature) return false;

  const expectedHex = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const expected = signature.startsWith('sha256=')
    ? `sha256=${expectedHex}`
    : expectedHex;

  const receivedBuffer = Buffer.from(String(signature), 'utf8');
  const expectedBuffer = Buffer.from(expected, 'utf8');

  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

function deprecated(req, res) {
  return res.status(410).json({
    ok: false,
    error: 'Legacy GitHub bounty auto-credit flow is disabled',
    replacement: '/api/github-bounties/webhook',
    note: 'GitHub events synchronize bounty metadata only. Reward/payment decisions require the verified MyZubster reward lifecycle.'
  });
}

module.exports = {
  verifySignature,
  handleIssueClosed: deprecated,
  registerUser: deprecated,
  getBountyHistory: deprecated,
  getUserBalance: deprecated,
  users: Object.freeze({})
};

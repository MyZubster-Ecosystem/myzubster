const { PostHog } = require('posthog-node');

let client = null;

function getClient() {
  const token = String(process.env.POSTHOG_PROJECT_TOKEN || '').trim();
  if (!token) return null;

  if (!client) {
    client = new PostHog(token, {
      host: String(process.env.POSTHOG_HOST || 'https://eu.i.posthog.com').trim(),
      flushAt: 1,
      flushInterval: 0
    });
  }

  return client;
}

async function captureFunnelEvent({ distinctId, event, properties = {} }) {
  const posthog = getClient();
  if (!posthog) return { sent: false, reason: 'POSTHOG_NOT_CONFIGURED' };

  await posthog.captureImmediate({
    distinctId: String(distinctId || 'anonymous'),
    event: String(event),
    properties: {
      source: 'myzubster',
      ...properties
    }
  });

  return { sent: true };
}

module.exports = { captureFunnelEvent };

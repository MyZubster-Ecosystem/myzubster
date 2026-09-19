const DEFAULT_HOST = 'https://eu.i.posthog.com';

async function captureFunnelEvent({ distinctId, event, properties = {} }) {
  const token = String(process.env.POSTHOG_PROJECT_TOKEN || '').trim();
  if (!token) return { sent: false, reason: 'POSTHOG_NOT_CONFIGURED' };

  const host = String(process.env.POSTHOG_HOST || DEFAULT_HOST).trim().replace(/\/$/, '');
  const response = await fetch(host + '/i/v0/e/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: token,
      distinct_id: String(distinctId || 'anonymous').slice(0, 200),
      event: String(event),
      properties: {
        $process_person_profile: false,
        source: 'myzubster',
        ...properties
      }
    })
  });

  if (!response.ok) {
    throw new Error('PostHog capture failed with HTTP ' + response.status);
  }

  return { sent: true };
}

module.exports = { captureFunnelEvent };

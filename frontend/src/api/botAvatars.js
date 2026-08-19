const BOT_API_URL = (process.env.REACT_APP_API_URL || 'https://api.myzubster.com').replace(/\/+$/, '');

function parseJsonResponse(res) {
  return res.json().catch(() => ({})).then(data => {
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  });
}

export function resolveBotAvatarUrl(path) {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value)) return value;
  return `${BOT_API_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

export async function getBotAvatarManifest() {
  const res = await fetch(`${BOT_API_URL}/media/bots/metadata.json`, {
    headers: { Accept: 'application/json' },
  });
  const data = await parseJsonResponse(res);

  if (!Array.isArray(data.agents)) {
    throw new Error('Invalid bot avatar metadata: agents must be an array');
  }

  return {
    ...data,
    agents: data.agents.map(agent => ({
      ...agent,
      avatarUrl: resolveBotAvatarUrl(agent.avatar),
    })),
  };
}

export function findBotAgent(manifest, id) {
  return manifest?.agents?.find(agent => agent.id === id) || null;
}

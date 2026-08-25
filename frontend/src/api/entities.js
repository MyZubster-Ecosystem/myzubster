export async function getCanonicalEntities() {
  const response = await fetch('/api/entities', { headers: { Accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok || !Array.isArray(data.entities)) {
    throw new Error(data.error || 'Registro entità non disponibile');
  }
  return data.entities;
}

export async function getEntityStatus(slug) {
  const response = await fetch(`/api/entities/${encodeURIComponent(slug)}/status`, { headers: { Accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || 'Stato non disponibile');
  return data;
}

export async function getEntityBounties(slug) {
  const response = await fetch(`/api/entities/${encodeURIComponent(slug)}/bounties`, {
    headers: { Accept: 'application/json' }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok || !Array.isArray(data.bounties)) {
    throw new Error(data.error || 'Bounty entità non disponibili');
  }
  return data;
}

export async function askEntity(slug, message) {
  const response = await fetch(`/api/entities/${encodeURIComponent(slug)}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ message })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) throw new Error(data.error || 'Assistente non disponibile');
  return data;
}

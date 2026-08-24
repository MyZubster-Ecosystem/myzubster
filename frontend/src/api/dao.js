async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `DAO API HTTP ${response.status}`);
  }
  return data;
}

export async function getDaoOverview() {
  return readJson(await fetch('/api/dao'));
}

export async function verifyDaoBallot(envelope) {
  return readJson(await fetch('/api/dao/ballots/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelope)
  }));
}

export async function verifyDaoDelegation(envelope) {
  return readJson(await fetch('/api/dao/delegations/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(envelope)
  }));
}

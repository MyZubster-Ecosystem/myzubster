const crypto = require('crypto');

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((out, key) => {
      if (value[key] !== undefined) out[key] = canonicalize(value[key]);
      return out;
    }, {});
  }
  return value;
}

function normalizeCommit(item = {}) {
  const sha = String(item.sha || '').trim();
  const repository = String(item.repository || '').trim();
  const url = String(item.url || item.htmlUrl || '').trim();
  const committedAt = item.committedAt ? new Date(item.committedAt).toISOString() : null;
  if (!/^[a-f0-9]{7,40}$/i.test(sha) || !repository || !url || !committedAt) return null;
  return { sha, repository, url, committedAt };
}

function buildGithubWorkEvidence(input = {}) {
  const account = String(input.account || '').trim();
  if (!account) throw new Error('account is required');
  const commits = (Array.isArray(input.commits) ? input.commits : []).map(normalizeCommit).filter(Boolean);
  if (!commits.length) throw new Error('at least one verifiable commit is required');
  const repos = [...new Set(commits.map(x => x.repository))].sort();
  const activeDays = [...new Set(commits.map(x => x.committedAt.slice(0,10)))].sort();
  const timestamps = commits.map(x => Date.parse(x.committedAt)).filter(Number.isFinite);
  const payload = canonicalize({
    schema: 'myzubster.github-work-evidence.v1',
    account,
    metrics: {
      commits: commits.length,
      repositories: repos.length,
      activeDays: activeDays.length,
      firstCommitAt: new Date(Math.min(...timestamps)).toISOString(),
      lastCommitAt: new Date(Math.max(...timestamps)).toISOString()
    },
    repositories: repos,
    commits: commits.sort((a,b) => a.committedAt.localeCompare(b.committedAt)),
    interpretation: 'Activity evidence only. These metrics document GitHub activity and continuity; they do not independently certify skill, employment, productivity, authorship of ideas, or dedication.',
    version: '1'
  });
  const evidenceHash = crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return { payload, evidenceHash, algorithm:'sha256', commitment:`MZ-GITHUB-WORK-V1:${evidenceHash}` };
}

function verifyGithubWorkEvidence(payload, expectedHash) {
  const actual = crypto.createHash('sha256').update(JSON.stringify(canonicalize(payload))).digest('hex');
  return actual === String(expectedHash || '').toLowerCase();
}

module.exports = { buildGithubWorkEvidence, verifyGithubWorkEvidence };

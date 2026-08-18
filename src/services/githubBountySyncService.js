const axios = require('axios');
const crypto = require('crypto');
const GitHubBounty = require('../models/githubBountyModel');

const GITHUB_API = 'https://api.github.com';
const GITHUB_ORG = process.env.GITHUB_ORG || 'MyZubster-Ecosystem';
const EXCLUDED_REPOSITORIES = new Set(['MyZubster-Ecosystem/tari']);
const repositoryVisibilityCache = new Map();

const STATUS_LABELS = [
  ['settlement:settled', 'settled'],
  ['status:settled', 'settled'],
  ['settlement:pending', 'settlement_pending'],
  ['status:reward-recorded', 'reward_recorded'],
  ['status:verified', 'verified'],
  ['status:review', 'under_review'],
  ['status:under-review', 'under_review'],
  ['status:submitted', 'submitted'],
  ['status:active', 'active'],
  ['status:funded', 'funded'],
  ['status:approved', 'approved'],
  ['status:available', 'approved'],
  ['status:validated', 'validated'],
  ['status:proposed', 'proposed'],
  ['status:cancelled', 'cancelled']
];

const TERMINAL_OR_EVIDENCE_GATED_STATUSES = new Set([
  'verified',
  'reward_recorded',
  'settlement_pending',
  'settled',
  'cancelled',
  'closed'
]);

const AUTO_TRANSITIONS = {
  active: new Set(['approved', 'funded']),
  submitted: new Set(['active', 'approved', 'funded']),
  under_review: new Set(['submitted', 'active'])
};

function labelNames(issue = {}) {
  return (issue.labels || [])
    .map(label => typeof label === 'string' ? label : label?.name)
    .filter(Boolean);
}

function deriveLifecycle(labels, githubState = 'open') {
  const set = new Set(labels || []);

  for (const [label, status] of STATUS_LABELS) {
    if (set.has(label)) return status;
  }

  return githubState === 'closed' ? 'closed' : 'unknown';
}

function canAutoTransition(currentStatus, targetStatus) {
  if (TERMINAL_OR_EVIDENCE_GATED_STATUSES.has(currentStatus)) return false;
  const allowed = AUTO_TRANSITIONS[targetStatus];
  return Boolean(allowed?.has(currentStatus));
}

function deriveRewardAssets(labels) {
  const set = new Set(labels || []);
  const assets = [];

  if (set.has('reward:myz')) assets.push('MYZ');
  if (set.has('reward:xmr')) assets.push('XMR');
  if (set.has('reward:token')) assets.push('TOKEN');

  return assets;
}

function normalizeDecimal(value) {
  if (!value) return null;
  const cleaned = String(value).replace(/,/g, '').trim();
  return /^\d+(?:\.\d+)?$/.test(cleaned) ? cleaned : null;
}

function parseRewardDeclarations(body = '', labels = []) {
  const declarations = [];
  const seen = new Set();
  const text = String(body || '');

  const patterns = [
    { asset: 'MYZ', regex: /(?:^|[^A-Z0-9])([0-9][0-9,.]*)\s*MYZ\b/gi },
    { asset: 'XMR', regex: /(?:^|[^A-Z0-9])([0-9][0-9,.]*)\s*XMR\b/gi }
  ];

  for (const { asset, regex } of patterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const amount = normalizeDecimal(match[1]);
      if (!amount) continue;
      const key = `${asset}:${amount}`;
      if (seen.has(key)) continue;
      seen.add(key);
      declarations.push({ asset, amount, raw: match[0].trim() });
    }
  }

  for (const asset of deriveRewardAssets(labels)) {
    if (!declarations.some(d => d.asset === asset)) {
      declarations.push({ asset, amount: null, raw: 'declared-by-label' });
    }
  }

  return declarations;
}

function deriveReviewMode(labels) {
  const set = new Set(labels || []);
  if (set.has('review:multi')) return 'multi';
  if (set.has('review:manual')) return 'manual';
  return 'normal';
}

function deriveSensitivity(labels) {
  const set = new Set(labels || []);
  if (set.has('sensitivity:high')) return 'high';
  if (set.has('sensitivity:elevated')) return 'elevated';
  return 'normal';
}

function repositoryFromApiUrl(repositoryUrl) {
  const prefix = `${GITHUB_API}/repos/`;
  return String(repositoryUrl || '').startsWith(prefix)
    ? String(repositoryUrl).slice(prefix.length)
    : null;
}

function normalizeVisibility(repositoryPayload = {}) {
  if (repositoryPayload.visibility === 'internal') return 'internal';
  if (repositoryPayload.private === true || repositoryPayload.visibility === 'private') return 'private';
  return 'public';
}

function issueToDocument(issue, repositoryOverride, sourceVisibility = 'public') {
  const repository =
    repositoryOverride ||
    issue.repository?.full_name ||
    repositoryFromApiUrl(issue.repository_url);

  if (!repository) {
    throw new Error('GitHub repository could not be determined');
  }

  const labels = labelNames(issue);
  const body = String(issue.body || '');
  const tracked = labels.includes('type:bounty');
  const rewardDeclarations = parseRewardDeclarations(body, labels);
  const assignees = (issue.assignees || [])
    .map(user => user?.login)
    .filter(Boolean);

  return {
    sourceKey: `${repository}#${issue.number}`,
    repository,
    sourceVisibility,
    issueNumber: issue.number,
    githubIssueId: issue.id || null,
    githubNodeId: issue.node_id || null,
    url: issue.html_url || null,
    title: issue.title || `Issue #${issue.number}`,
    bodyPreview: body.slice(0, 4000),
    bodySha256: crypto.createHash('sha256').update(body).digest('hex'),
    githubState: issue.state === 'closed' ? 'closed' : 'open',
    tracked,
    labels,
    lifecycleStatus: deriveLifecycle(labels, issue.state),
    rewardAssets: [...new Set(rewardDeclarations.map(d => d.asset))],
    rewardDeclarations,
    assignees,
    claimedBy: assignees[0] || null,
    author: issue.user?.login || null,
    reviewMode: deriveReviewMode(labels),
    sensitivity: deriveSensitivity(labels),
    evidenceRequired: labels.includes('evidence:required'),
    sourceCreatedAt: issue.created_at || null,
    sourceUpdatedAt: issue.updated_at || null,
    sourceClosedAt: issue.closed_at || null,
    lastSyncedAt: new Date()
  };
}

async function upsertIssue(issue, repositoryOverride, sourceVisibility = 'public') {
  const doc = issueToDocument(issue, repositoryOverride, sourceVisibility);

  if (EXCLUDED_REPOSITORIES.has(doc.repository)) {
    return { skipped: true, reason: 'excluded-repository', repository: doc.repository };
  }

  return GitHubBounty.findOneAndUpdate(
    { sourceKey: doc.sourceKey },
    { $set: doc },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'MyZubster-GitHub-Bounty-Sync/1.0'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function getRepositoryVisibility(repository) {
  if (repositoryVisibilityCache.has(repository)) {
    return repositoryVisibilityCache.get(repository);
  }

  const response = await axios.get(`${GITHUB_API}/repos/${repository}`, {
    headers: githubHeaders(),
    timeout: 10000
  });

  const visibility = normalizeVisibility(response.data || {});
  repositoryVisibilityCache.set(repository, visibility);
  return visibility;
}

async function setGitHubLifecycle(repository, issueNumber, targetLabel, targetStatus) {
  if (!process.env.GITHUB_TOKEN) {
    return { changed: false, reason: 'github-token-missing' };
  }

  const response = await axios.get(
    `${GITHUB_API}/repos/${repository}/issues/${issueNumber}`,
    { headers: githubHeaders(), timeout: 10000 }
  );

  const issue = response.data || {};
  const labels = labelNames(issue);
  const currentStatus = deriveLifecycle(labels, issue.state);

  if (!canAutoTransition(currentStatus, targetStatus)) {
    return { changed: false, reason: 'transition-not-allowed', currentStatus, targetStatus };
  }

  if (labels.includes(targetLabel)) {
    return { changed: false, reason: 'already-set', currentStatus, targetStatus };
  }

  const nextLabels = [
    ...labels.filter(name => !String(name).startsWith('status:')),
    targetLabel
  ];

  const updated = await axios.patch(
    `${GITHUB_API}/repos/${repository}/issues/${issueNumber}`,
    { labels: [...new Set(nextLabels)] },
    { headers: githubHeaders(), timeout: 10000 }
  );

  const visibility = await getRepositoryVisibility(repository);
  await upsertIssue(updated.data, repository, visibility);

  return { changed: true, from: currentStatus, to: targetStatus, label: targetLabel };
}

async function syncOrganizationBounties() {
  const query = `org:${GITHUB_ORG} is:issue label:\"type:bounty\"`;
  let page = 1;
  let imported = 0;
  let skipped = 0;
  const touchedKeys = new Set();

  while (page <= 10) {
    const response = await axios.get(`${GITHUB_API}/search/issues`, {
      params: {
        q: query,
        per_page: 100,
        page
      },
      headers: githubHeaders(),
      timeout: 15000
    });

    const items = response.data?.items || [];

    for (const issue of items) {
      const repository = repositoryFromApiUrl(issue.repository_url);
      if (!repository || EXCLUDED_REPOSITORIES.has(repository)) {
        skipped++;
        continue;
      }

      const sourceVisibility = await getRepositoryVisibility(repository);
      const saved = await upsertIssue(issue, repository, sourceVisibility);
      touchedKeys.add(`${repository}#${issue.number}`);
      if (saved?.skipped) skipped++;
      else imported++;
    }

    if (items.length < 100) break;
    page++;
  }

  if (touchedKeys.size > 0) {
    await GitHubBounty.updateMany(
      {
        tracked: true,
        sourceKey: { $nin: [...touchedKeys] }
      },
      {
        $set: {
          tracked: false,
          lastSyncedAt: new Date()
        }
      }
    );
  }

  return {
    organization: GITHUB_ORG,
    imported,
    skipped,
    tracked: touchedKeys.size
  };
}

function extractClosingIssueNumbers(body = '') {
  const refs = String(body || '').match(
    /(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/gi
  ) || [];

  return [...new Set(refs.map(ref => Number(ref.match(/\d+/)?.[0])).filter(Boolean))];
}

async function applyPullRequestEvent(payload) {
  const repository = payload.repository?.full_name;
  const pr = payload.pull_request;
  if (!repository || !pr) return { updated: 0 };

  const issueNumbers = extractClosingIssueNumbers(pr.body || '');
  let updated = 0;
  const transitions = [];

  for (const issueNumber of issueNumbers) {
    const bounty = await GitHubBounty.findOne({
      sourceKey: `${repository}#${issueNumber}`
    });

    if (!bounty) continue;

    const existing = bounty.pullRequests.find(item => item.number === pr.number);
    const record = {
      number: pr.number,
      url: pr.html_url || null,
      author: pr.user?.login || null,
      merged: Boolean(pr.merged),
      mergedAt: pr.merged_at || null
    };

    if (existing) {
      Object.assign(existing, record);
    } else {
      bounty.pullRequests.push(record);
    }

    bounty.sourceVisibility = normalizeVisibility(payload.repository);
    if (pr.user?.login) bounty.claimedBy = pr.user.login;
    bounty.lastSyncedAt = new Date();
    await bounty.save();
    updated++;

    const submissionAction = ['opened', 'reopened', 'synchronize', 'ready_for_review'].includes(payload.action);
    if (submissionAction && !pr.draft) {
      transitions.push({
        issueNumber,
        ...(await setGitHubLifecycle(repository, issueNumber, 'status:submitted', 'submitted'))
      });
    }
  }

  return { updated, issueNumbers, transitions };
}

async function applyReviewEvent(payload) {
  const repository = payload.repository?.full_name;
  const pr = payload.pull_request;
  const review = payload.review;
  if (!repository || !pr || !review) return { updated: 0 };

  const issueNumbers = extractClosingIssueNumbers(pr.body || '');
  let updated = 0;
  const transitions = [];

  const stateMap = {
    approved: 'approved',
    changes_requested: 'changes_requested',
    commented: 'commented',
    dismissed: 'dismissed'
  };

  for (const issueNumber of issueNumbers) {
    const bounty = await GitHubBounty.findOne({
      sourceKey: `${repository}#${issueNumber}`
    });

    if (!bounty) continue;

    const reviewer = review.user?.login;
    if (!reviewer) continue;

    const record = {
      reviewer,
      state: stateMap[review.state] || 'unknown',
      submittedAt: review.submitted_at || null
    };

    const existing = bounty.reviewers.find(item => item.reviewer === reviewer);
    if (existing) Object.assign(existing, record);
    else bounty.reviewers.push(record);

    bounty.sourceVisibility = normalizeVisibility(payload.repository);
    bounty.lastSyncedAt = new Date();
    await bounty.save();
    updated++;

    if (payload.action === 'submitted' && ['approved', 'changes_requested', 'commented'].includes(review.state)) {
      transitions.push({
        issueNumber,
        ...(await setGitHubLifecycle(repository, issueNumber, 'status:review', 'under_review'))
      });
    }
  }

  return { updated, issueNumbers, transitions };
}

async function processWebhook(eventName, payload) {
  if (eventName === 'issues') {
    const issue = payload.issue;
    const repository = payload.repository?.full_name;
    if (!issue || !repository) return { ignored: true, reason: 'missing-issue' };

    const labels = labelNames(issue);
    const sourceKey = `${repository}#${issue.number}`;
    const existing = await GitHubBounty.findOne({ sourceKey });

    if (!labels.includes('type:bounty') && !existing) {
      return { ignored: true, reason: 'not-a-bounty' };
    }

    const sourceVisibility = normalizeVisibility(payload.repository);
    const saved = await upsertIssue(issue, repository, sourceVisibility);
    let transition = null;

    if (payload.action === 'assigned' && (issue.assignees || []).length > 0) {
      transition = await setGitHubLifecycle(repository, issue.number, 'status:active', 'active');
    }

    return {
      ignored: false,
      sourceKey,
      tracked: Boolean(saved?.tracked),
      transition
    };
  }

  if (eventName === 'pull_request') {
    return applyPullRequestEvent(payload);
  }

  if (eventName === 'pull_request_review') {
    return applyReviewEvent(payload);
  }

  return { ignored: true, reason: 'unsupported-event' };
}

module.exports = {
  labelNames,
  deriveLifecycle,
  canAutoTransition,
  deriveRewardAssets,
  parseRewardDeclarations,
  deriveReviewMode,
  deriveSensitivity,
  normalizeVisibility,
  issueToDocument,
  upsertIssue,
  setGitHubLifecycle,
  syncOrganizationBounties,
  extractClosingIssueNumbers,
  processWebhook
};

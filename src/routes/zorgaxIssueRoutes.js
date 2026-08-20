const express = require('express');
const crypto = require('crypto');

const router = express.Router();

const DEFAULT_REPOSITORY = 'MyZubster-Ecosystem/myzubster';
const DEFAULT_OWNER = 'MyZubster-Ecosystem';
const DEFAULT_CATEGORIES = ['bug', 'data-anomaly', 'documentation', 'improvement', 'environmental-observation', 'technical-debt'];
const DEFAULT_SEVERITIES = ['info', 'low', 'medium', 'high'];

function boolEnv(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function allowedRepositories() {
  return String(process.env.ZORGAX_GITHUB_ALLOWED_REPOS || DEFAULT_REPOSITORY)
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

function safeText(value, max) {
  return String(value || '').trim().slice(0, max);
}

function looksSensitive(text) {
  const value = String(text || '');
  return [
    /password\s*[:=]/i,
    /api[_ -]?key\s*[:=]/i,
    /secret\s*[:=]/i,
    /private[_ -]?key/i,
    /seed phrase/i,
    /recovery phrase/i,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\b(?:ghp|github_pat|sk|pk)_[A-Za-z0-9_-]{16,}\b/
  ].some(pattern => pattern.test(value));
}

function validAdminKey(req) {
  const configured = process.env.ZORGAX_ADMIN_KEY;
  const supplied = req.get('x-zorgax-admin-key');
  if (!configured || !supplied) return false;
  const a = Buffer.from(String(configured));
  const b = Buffer.from(String(supplied));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function base64url(value) {
  const input = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return input.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function normalizedPrivateKey() {
  const raw = process.env.ZORGAX_GITHUB_PRIVATE_KEY;
  if (!raw) return null;
  return String(raw).replace(/\\n/g, '\n').trim();
}

function createGitHubAppJwt() {
  const appId = safeText(process.env.ZORGAX_GITHUB_APP_ID, 40);
  const privateKey = normalizedPrivateKey();
  if (!appId || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iat: now - 30,
    exp: now + 8 * 60,
    iss: appId
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), privateKey);
  return `${unsigned}.${base64url(signature)}`;
}

async function githubJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'MyZubster-Zorgax-Issue-Agent',
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.message || `GitHub HTTP ${response.status}`);
    error.status = response.status;
    error.github = data;
    throw error;
  }
  return data;
}

async function resolveInstallationId(appJwt) {
  const configured = safeText(process.env.ZORGAX_GITHUB_INSTALLATION_ID, 40);
  if (configured) return configured;

  const owner = safeText(process.env.ZORGAX_GITHUB_OWNER || DEFAULT_OWNER, 120);
  const installations = await githubJson('https://api.github.com/app/installations?per_page=100', {
    headers: { Authorization: `Bearer ${appJwt}` }
  });
  const match = Array.isArray(installations)
    ? installations.find(item => String(item?.account?.login || '').toLowerCase() === owner.toLowerCase())
    : null;
  if (!match?.id) throw new Error(`GitHub App installation not found for ${owner}`);
  return String(match.id);
}

async function mintInstallationToken() {
  const appJwt = createGitHubAppJwt();
  if (!appJwt) return null;
  const installationId = await resolveInstallationId(appJwt);
  const tokenData = await githubJson(
    `https://api.github.com/app/installations/${encodeURIComponent(installationId)}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJwt}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    }
  );
  if (!tokenData?.token) throw new Error('GitHub installation token was not returned');
  return {
    token: tokenData.token,
    installation_id: installationId,
    expires_at: tokenData.expires_at || null,
    source: 'github-app-installation'
  };
}

async function publishingCredential() {
  const appCredential = await mintInstallationToken();
  if (appCredential) return appCredential;

  const fallback = process.env.ZORGAX_GITHUB_TOKEN || process.env.GITHUB_TOKEN;
  if (!fallback) return null;
  return { token: fallback, installation_id: null, expires_at: null, source: 'legacy-token' };
}

function githubAuthMode() {
  if (process.env.ZORGAX_GITHUB_APP_ID && process.env.ZORGAX_GITHUB_PRIVATE_KEY) return 'github-app';
  if (process.env.ZORGAX_GITHUB_TOKEN || process.env.GITHUB_TOKEN) return 'legacy-token';
  return 'unconfigured';
}

function normalizeEvidence(evidence) {
  if (!Array.isArray(evidence)) return [];
  return evidence.slice(0, 10).map(item => ({
    source: safeText(item?.source || 'unspecified', 200),
    reference: safeText(item?.reference || '', 500),
    claim_class: ['verified', 'uncertain', 'speculative', 'fictional'].includes(item?.claim_class)
      ? item.claim_class
      : 'uncertain',
    note: safeText(item?.note || '', 1000)
  }));
}

function buildDraft(input = {}) {
  const title = safeText(input.title, 180);
  const summary = safeText(input.summary || input.body, 5000);
  const category = DEFAULT_CATEGORIES.includes(input.category) ? input.category : 'improvement';
  const severity = DEFAULT_SEVERITIES.includes(input.severity) ? input.severity : 'info';
  const repository = safeText(input.repository || DEFAULT_REPOSITORY, 200);
  const evidence = normalizeEvidence(input.evidence);
  const proposedAction = safeText(input.proposed_action, 2000);

  if (!title) throw new Error('title is required');
  if (!summary) throw new Error('summary is required');
  if (!allowedRepositories().includes(repository)) throw new Error('repository is not allowed');

  const allText = [title, summary, proposedAction, JSON.stringify(evidence)].join('\n');
  if (looksSensitive(allText)) throw new Error('possible credential or secret detected');

  const evidenceBlock = evidence.length
    ? evidence.map((item, index) => [
        `${index + 1}. **${item.source}** — \`${item.claim_class}\``,
        item.reference ? `   - Reference: ${item.reference}` : null,
        item.note ? `   - Note: ${item.note}` : null
      ].filter(Boolean).join('\n')).join('\n')
    : '_No external evidence supplied. Treat this proposal as unverified until a human checks it._';

  const body = [
    '> 🤖 **Zorgax automated proposal** — Zorgax is a virtual/fictional AI persona in the MyZubster ecosystem. This issue was generated by software and requires human review. It does not represent a decision, endorsement, partnership, contract, scientific conclusion, or institutional position.',
    '',
    '## Summary',
    summary,
    '',
    '## Classification',
    `- Category: \`${category}\``,
    `- Severity: \`${severity}\``,
    '- Decision authority: **human maintainers only**',
    '',
    '## Evidence / provenance',
    evidenceBlock,
    '',
    '## Proposed action',
    proposedAction || '_Zorgax has not proposed a specific implementation action._',
    '',
    '## Human review checklist',
    '- [ ] Verify the evidence and claim classes',
    '- [ ] Check for duplicate/existing issues',
    '- [ ] Confirm scope and priority',
    '- [ ] Decide whether to accept, reject, edit, or convert into implementation work',
    '',
    '---',
    '_Generated by ZORGAX-001. Automated content is a proposal, not proof._'
  ].join('\n');

  return {
    repository,
    title: `[ZORGAX] ${title}`,
    body,
    metadata: {
      entity: 'ZORGAX-001',
      virtual_identity: true,
      category,
      severity,
      evidence_count: evidence.length,
      requires_human_review: true
    }
  };
}

router.get('/status', (req, res) => {
  res.json({
    ok: true,
    entity: 'ZORGAX-001',
    capability: 'github-issue-agent',
    write_enabled: boolEnv('ZORGAX_GITHUB_WRITE_ENABLED', false),
    auth_mode: githubAuthMode(),
    app_id_configured: Boolean(process.env.ZORGAX_GITHUB_APP_ID),
    private_key_configured: Boolean(process.env.ZORGAX_GITHUB_PRIVATE_KEY),
    installation_id_configured: Boolean(process.env.ZORGAX_GITHUB_INSTALLATION_ID),
    installation_auto_discovery: true,
    allowed_repositories: allowedRepositories(),
    human_review_required: true,
    publish_requires_admin_key: true,
    disclosure: 'Zorgax is a virtual/fictional AI persona; its issues are automated proposals only.'
  });
});

router.post('/propose', (req, res) => {
  try {
    const draft = buildDraft(req.body || {});
    res.status(200).json({ ok: true, published: false, draft });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

router.post('/publish', async (req, res) => {
  try {
    if (!boolEnv('ZORGAX_GITHUB_WRITE_ENABLED', false)) {
      return res.status(403).json({ ok: false, error: 'Zorgax GitHub writes are disabled' });
    }
    if (!validAdminKey(req)) {
      return res.status(403).json({ ok: false, error: 'Valid x-zorgax-admin-key required' });
    }

    const credential = await publishingCredential();
    if (!credential) {
      return res.status(503).json({ ok: false, error: 'GitHub publishing credential is not configured' });
    }

    const draft = buildDraft(req.body || {});
    const [owner, repo] = draft.repository.split('/');
    if (!owner || !repo) return res.status(400).json({ ok: false, error: 'Invalid repository format' });

    const data = await githubJson(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credential.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: draft.title, body: draft.body })
    });

    res.status(201).json({
      ok: true,
      published: true,
      entity: 'ZORGAX-001',
      auth_source: credential.source,
      installation_id: credential.installation_id,
      issue: {
        number: data.number,
        title: data.title,
        url: data.html_url,
        repository: draft.repository
      },
      human_review_required: true
    });
  } catch (error) {
    res.status(error.status && Number.isInteger(error.status) ? error.status : 400).json({
      ok: false,
      error: error.message,
      github_status: error.status || null,
      github_message: error.github?.message || null
    });
  }
});

module.exports = router;
module.exports.buildDraft = buildDraft;
module.exports.createGitHubAppJwt = createGitHubAppJwt;
module.exports.resolveInstallationId = resolveInstallationId;

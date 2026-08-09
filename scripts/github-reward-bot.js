#!/usr/bin/env node
/**
 * MyZubster GitHub Reward Bot
 * Automatically credits contributors when their PR is merged
 * Listens for GitHub webhooks, validates bounty labels, mints MYZ via Gateway
 */

const http = require('http');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  port: process.env.BOT_PORT || 3000,
  webhookSecret: process.env.WEBHOOK_SECRET || 'myzubster-webhook-secret',
  gatewayUrl: process.env.GATEWAY_URL || 'https://api.myzubster.com',
  // Reward mapping: label -> MYZ amount
  rewardTiers: {
    'easy': 5,
    'medium': 10,
    'hard': 20,
    'critical': 35,
    'documentation': 5,
    'community': 30
  },
  auditLog: process.env.AUDIT_LOG || './reward-bot-audit.log'
};

// Logger
function log(level, message, data = {}) {
  const ts = new Date().toISOString();
  const entry = `[${ts}] [${level}] ${message} ${JSON.stringify(data)}`;
  console.log(entry);
  require('fs').appendFileSync(CONFIG.auditLog, entry + '\n');
}

// Verify GitHub webhook signature
function verifySignature(payload, signature) {
  const hmac = crypto.createHmac('sha256', CONFIG.webhookSecret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

// Extract bounty amount from issue labels
function extractBountyAmount(issue) {
  const labels = issue.labels || [];
  for (const label of labels) {
    const name = (label.name || '').toLowerCase();
    if (CONFIG.rewardTiers[name]) {
      return CONFIG.rewardTiers[name];
    }
  }
  // Try to find amount in issue body
  const body = issue.body || '';
  const match = body.match(/bounty:\s*(\d+)\s*MYZ/i) || body.match(/(\d+)\s*MYZ/i);
  return match ? parseInt(match[1]) : 10; // default 10 MYZ
}

// Mint MYZ via Gateway
async function mintReward(walletAddress, amount, reason) {
  const payload = JSON.stringify({
    wallet: walletAddress,
    amount: amount,
    reason: reason,
    token: 'MYZ'
  });

  return new Promise((resolve, reject) => {
    const url = new URL('/mint', CONFIG.gatewayUrl);
    const req = http.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        log('INFO', 'Mint response', { status: res.statusCode, body });
        resolve({ success: res.statusCode === 200, tx: body });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Get contributor wallet from GitHub profile or stored mapping
function getContributorWallet(login) {
  const WALLETS = JSON.parse(process.env.CONTRIBUTOR_WALLETS || '{}');
  return WALLETS[login] || null;
}

// Process merged PR
async function processMergedPR(pr) {
  const { number, title, user, head, base, body: prBody } = pr;
  const contributor = user.login;

  log('INFO', `Processing merged PR #${number}`, { contributor, title });

  // Find linked issue from PR body (e.g., "Closes #1234" or "Fixes #567")
  const issueMatch = (prBody || '').match(/(?:closes|fixes|resolves)\s+#(\d+)/i);
  if (!issueMatch) {
    log('WARN', `No linked issue found in PR #${number}`, { body: prBody?.substring(0, 100) });
    return;
  }

  const issueNumber = parseInt(issueMatch[1]);

  // Fetch issue details via GitHub API
  const issue = await fetchIssue(pr.base.repo.full_name, issueNumber);
  if (!issue) {
    log('ERROR', `Could not fetch issue #${issueNumber}`);
    return;
  }

  // Check if issue has bounty label
  const hasBounty = (issue.labels || []).some(l => l.name === 'bounty');
  if (!hasBounty) {
    log('INFO', `Issue #${issueNumber} has no bounty label, skipping`);
    return;
  }

  const amount = extractBountyAmount(issue);
  const wallet = getContributorWallet(contributor);

  if (!wallet) {
    log('WARN', `No wallet found for ${contributor}, logging for manual review`);
    // Log for manual processing
    require('fs').appendFileSync(
      './pending-rewards.log',
      `${new Date().toISOString()},${contributor},${amount},PR#${number},Issue#${issueNumber}\n`
    );
    return;
  }

  const reason = `PR #${number}: ${title} (Issue #${issueNumber})`;
  const result = await mintReward(wallet, amount, reason);

  if (result.success) {
    log('SUCCESS', `Rewarded ${contributor} with ${amount} MYZ`, { pr: number, tx: result.tx });
  } else {
    log('ERROR', `Failed to mint ${amount} MYZ to ${contributor}`);
  }
}

// Fetch issue from GitHub API
function fetchIssue(repoFullName, issueNumber) {
  return new Promise((resolve, reject) => {
    const [owner, repo] = repoFullName.split('/');
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/issues/${issueNumber}`,
      headers: {
        'User-Agent': 'MyZubster-Reward-Bot/1.0',
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN ? { 'Authorization': `token ${process.env.GITHUB_TOKEN}` } : {})
      }
    };
    http.get(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Create HTTP server for webhook
const server = http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405); res.end('Method Not Allowed');
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    const signature = req.headers['x-hub-signature-256'] || '';

    // Verify webhook
    if (!verifySignature(body, signature)) {
      log('WARN', 'Invalid webhook signature');
      res.writeHead(401); res.end('Unauthorized');
      return;
    }

    const event = req.headers['x-github-event'];
    log('INFO', `Received webhook event: ${event}`);

    try {
      const payload = JSON.parse(body);

      if (event === 'pull_request' && payload.action === 'closed' && payload.pull_request.merged) {
        // PR merged -> reward!
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'processing' }));

        // Process async
        processMergedPR(payload.pull_request).catch(e =>
          log('ERROR', 'processMergedPR failed', { error: e.message })
        );
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ignored', event }));
    } catch (e) {
      log('ERROR', 'Webhook processing error', { error: e.message });
      res.writeHead(400); res.end('Bad Request');
    }
  });
});

server.listen(CONFIG.port, () => {
  log('INFO', `MyZubster Reward Bot started on port ${CONFIG.port}`);
  log('INFO', `Gateway: ${CONFIG.gatewayUrl}`);
  log('INFO', `Audit log: ${CONFIG.auditLog}`);
});

// Graceful shutdown
process.on('SIGTERM', () => { log('INFO', 'Shutting down'); server.close(); process.exit(0); });
process.on('SIGINT', () => { log('INFO', 'Shutting down'); server.close(); process.exit(0); });

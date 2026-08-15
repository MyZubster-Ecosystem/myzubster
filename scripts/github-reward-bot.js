'use strict';

const http = require('http');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');
const path = require('path');

const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || '';
const GATEWAY_URL = process.env.GATEWAY_API_URL || 'http://localhost:3001';
const GATEWAY_KEY = process.env.GATEWAY_API_KEY || '';
const PORT = parseInt(process.env.PORT || '4000', 10);

function verifySignature(payload, signature) {
  if (!WEBHOOK_SECRET) return true;
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
  hmac.update(payload);
  const digest = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

function parseBountyAmount(labels) {
  if (!Array.isArray(labels)) return null;
  for (const label of labels) {
    const name = (label.name || label || '').toLowerCase();
    const match = name.match(/^(\d+)\s*(myz|usdc|usd)$/i);
    if (match) return { amount: parseInt(match[1], 10), currency: match[2].toUpperCase() };
    if (name.includes('reward')) {
      const amt = name.match(/(\d+)/);
      if (amt) return { amount: parseInt(amt[1], 10), currency: 'MYZ' };
    }
  }
  const labelMap = { 'bounty': 40, 'good first issue': 25, 'bug': 15 };
  for (const label of labels) {
    const name = (label.name || label || '').toLowerCase();
    if (labelMap[name]) return { amount: labelMap[name], currency: 'MYZ' };
  }
  return null;
}

function mintReward(contributor, issueNumber, amount, currency) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      recipient: contributor,
      amount: amount,
      currency: currency || 'MYZ',
      reason: 'Bounty reward for issue #' + issueNumber,
      source: 'github-reward-bot'
    });
    const url = new URL('/mint', GATEWAY_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...(GATEWAY_KEY ? { 'Authorization': 'Bearer ' + GATEWAY_KEY } : {})
      },
      timeout: 15000
    };
    const mod = url.protocol === 'https:' ? https : http;
    const req = mod.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('[RewardBot] Minted ' + amount + ' ' + currency + ' to ' + contributor + ' for #' + issueNumber);
          resolve({ success: true, response: data });
        } else {
          reject(new Error('Gateway returned ' + res.statusCode + ': ' + data));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Gateway timeout')); });
    req.write(body);
    req.end();
  });
}

function getIssueLabels(owner, repo, issueNumber) {
  return new Promise((resolve, reject) => {
    const url = 'https://api.github.com/repos/' + owner + '/' + repo + '/issues/' + issueNumber + '/labels';
    const headers = {
      'User-Agent': 'myzubster-reward-bot/1.0',
      'Accept': 'application/vnd.github.v3+json'
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = 'token ' + process.env.GITHUB_TOKEN;
    }
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try { resolve(JSON.parse(data)); } catch(e) { resolve([]); }
        } else { resolve([]); }
      });
    }).on('error', reject);
  });
}

function auditLog(entry) {
  const timestamp = new Date().toISOString();
  const line = JSON.stringify({ timestamp, ...entry });
  console.log(line);
  const logDir = path.join(__dirname, '..', 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  fs.appendFileSync(path.join(logDir, 'reward-bot.log'), line + '\n');
}

async function handlePullRequest(event, payload) {
  const action = payload.action;
  const pr = payload.pull_request;
  if (action !== 'closed' || !pr || !pr.merged) return;

  const contributor = pr.user ? pr.user.login : 'unknown';
  const body = pr.body || '';
  const owner = payload.repository ? payload.repository.owner.login : '';
  const repo = payload.repository ? payload.repository.name : '';

  const issueMatch = body.match(/(?:close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s+#(\d+)/i);
  if (!issueMatch) {
    auditLog({ event: 'no_issue_ref', pr: pr.number, contributor });
    return;
  }

  const issueNumber = parseInt(issueMatch[1], 10);
  auditLog({ event: 'pr_merged', pr: pr.number, issue: issueNumber, contributor });

  let labels = [];
  try { labels = await getIssueLabels(owner, repo, issueNumber); }
  catch (err) {
    auditLog({ event: 'label_fetch_failed', issue: issueNumber, error: err.message });
    return;
  }

  const bounty = parseBountyAmount(labels);
  if (!bounty) {
    auditLog({ event: 'no_bounty_label', issue: issueNumber, labels: labels.map(l => l.name) });
    return;
  }

  auditLog({ event: 'minting', issue: issueNumber, contributor, amount: bounty.amount, currency: bounty.currency });
  try {
    await mintReward(contributor, issueNumber, bounty.amount, bounty.currency);
    auditLog({ event: 'reward_minted', issue: issueNumber, contributor, amount: bounty.amount, currency: bounty.currency });
  } catch (err) {
    auditLog({ event: 'mint_failed', issue: issueNumber, contributor, error: err.message });
  }
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'github-reward-bot' }));
    return;
  }
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      const signature = req.headers['x-hub-signature-256'];
      if (!verifySignature(body, signature)) {
        res.writeHead(401); res.end('Invalid signature');
        auditLog({ event: 'invalid_signature' }); return;
      }
      const event = req.headers['x-github-event'] || 'unknown';
      let payload;
      try { payload = JSON.parse(body); } catch(e) {
        res.writeHead(400); res.end('Invalid JSON'); return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
      if (event === 'pull_request') {
        try { await handlePullRequest(event, payload); }
        catch (err) { auditLog({ event: 'handler_error', error: err.message }); }
      }
    });
    return;
  }
  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log('[RewardBot] Listening on port ' + PORT);
  console.log('[RewardBot] Gateway: ' + GATEWAY_URL);
  console.log('[RewardBot] Webhook secret: ' + (WEBHOOK_SECRET ? 'configured' : 'NOT SET'));
});

process.on('SIGTERM', () => {
  console.log('[RewardBot] Shutting down...');
  server.close(() => process.exit(0));
});

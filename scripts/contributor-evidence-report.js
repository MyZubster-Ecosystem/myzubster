#!/usr/bin/env node
'use strict';

/**
 * Read-only evidence prototype for issue #1588.
 * Usage: node scripts/contributor-evidence-report.js MyZubster-Ecosystem/myzubster 1550
 * Optional: GITHUB_TOKEN (only needed for private repositories / higher rate limits).
 * Does NOT publish passport data, award bounties, or modify README/main.
 */
const [repo, number] = process.argv.slice(2);
if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '') || !/^[1-9]\d*$/.test(number || '')) {
  console.error('Usage: node scripts/contributor-evidence-report.js owner/repo PR_NUMBER');
  process.exit(2);
}
const api = 'https://api.github.com';
const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'myzubster-contributor-evidence-prototype' };
if (process.env.GITHUB_TOKEN) headers.Authorization = 'Bearer ' + process.env.GITHUB_TOKEN;

async function get(path) {
  const response = await fetch(api + path, { headers, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('GitHub API returned HTTP ' + response.status + ' for ' + path);
  return response.json();
}
const esc = value => String(value ?? '').replace(/[\\`|<>\r\n]/g, ' ').trim();

async function main() {
  const path = '/repos/' + repo + '/pulls/' + number;
  const pr = await get(path);
  const repoMeta = await get('/repos/' + repo);
  if (pr.base?.repo?.full_name !== repoMeta.full_name) throw new Error('PR target repository mismatch');

  // A merged PR is stronger provenance than a self-reported contribution.
  // Do not confuse merge with independent test execution or funding.
  const merged = pr.merged_at !== null;
  const status = merged ? 'MERGED' : (pr.state === 'closed' ? 'CLOSED_UNMERGED' : 'SUBMITTED');
  const author = pr.user?.login || 'UNKNOWN';
  const sha = pr.merge_commit_sha || pr.head?.sha || '';
  const evidence = {
    repository: repoMeta.full_name, number: pr.number, author, status,
    title: pr.title, url: pr.html_url, head_sha: pr.head?.sha || null,
    merge_sha: merged ? (pr.merge_commit_sha || null) : null,
    merged_at: merged ? pr.merged_at : null,
    source: 'GitHub REST pulls; read-only inspection',
    tested: false, payment_verified: false, dao_membership_verified: false,
  };
  process.stdout.write([
    '# Contributor evidence — read-only preview',
    '', '> Generated from GitHub metadata. NOT a Contributor Passport, CI attestation, DAO decision or proof of payment.',
    '', '| Field | GitHub evidence |', '| --- | --- |',
    '| Repository | ' + esc(evidence.repository) + ' |',
    '| Pull request | #' + evidence.number + ' |',
    '| Author | @' + esc(author) + ' |',
    '| Status | ' + evidence.status + ' |',
    '| Head SHA | `' + esc(evidence.head_sha) + '` |',
    '| Merge SHA | ' + (evidence.merge_sha ? '`' + esc(evidence.merge_sha) + '`' : 'not available') + ' |',
    '| Merged UTC | ' + esc(evidence.merged_at || 'not merged') + ' |',
    '| Source | ' + esc(evidence.url) + ' |',
    '| Independent tests | NOT VERIFIED |',
    '| Payment / MYZ settlement | NOT VERIFIED |',
    '| DAO membership | NOT VERIFIED |',
    '', 'Review consent and evidence scope before publishing in README, Passport or Knowledge Graph.', ''
  ].join('\n'));
}
main().catch(error => { console.error('Evidence check failed: ' + error.message); process.exitCode = 1; });

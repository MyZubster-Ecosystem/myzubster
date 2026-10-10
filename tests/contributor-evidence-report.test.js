'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const script = path.resolve(__dirname, '../scripts/contributor-evidence-report.js');
const repository = 'MyZubster-Ecosystem/myzubster';

function run(state, options = {}) {
  const code = [
    "process.argv = ['node', 'script', 'MyZubster-Ecosystem/myzubster', '1582'];",
    "const s = JSON.parse(process.env.TEST_SCENARIO);",
    "global.fetch = async url => {",
    "  if (s.error) return {ok:false,status:403};",
    "  const value = url.endsWith('/pulls/1582') ? {number:1582,state:s.state,merged_at:s.merged_at,",
    "    head:{sha:'abcdef123456'},merge_commit_sha:s.merge_commit_sha,user:{login:'wasim-builds'},",
    "    base:{repo:{full_name:s.target}},html_url:'https://github.com/MyZubster-Ecosystem/myzubster/pull/1582'}",
    "    : {full_name:'MyZubster-Ecosystem/myzubster'};",
    "  return {ok:true,json:async()=>value};",
    "};",
    "require(" + JSON.stringify(script) + ");"
  ].join('\n');
  return spawnSync(process.execPath, ['-e', code], {
    encoding: 'utf8',
    env: {...process.env, GITHUB_TOKEN: '', TEST_SCENARIO: JSON.stringify({
      state,
      merged_at: state === 'closed' && options.merged ? '2026-10-10T05:38:23Z' : null,
      merge_commit_sha: options.merged ? 'f9898d28899653ee483460f4cdd2d10d323e5459' : null,
      target: options.wrongRepo ? 'not-the-target/repo' : repository,
      error: Boolean(options.error)
    })}
  });
}
test('merged PR remains distinct from testing and funding', () => {
  const r = run('closed', {merged:true});
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\| Status \| MERGED \|/);
  assert.match(r.stdout, /f9898d28899653ee483460f4cdd2d10d323e5459/);
  assert.match(r.stdout, /\| Independent tests \| NOT VERIFIED \|/);
  assert.match(r.stdout, /\| Payment \/ MYZ settlement \| NOT VERIFIED \|/);
});
test('open PR is only submitted', () => {
  const r = run('open');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /\| Status \| SUBMITTED \|/);
});
test('closed unmerged PR is not merged', () => {
  const r = run('closed');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /CLOSED_UNMERGED/);
});
test('repository mismatch fails closed', () => {
  const r = run('open', {wrongRepo:true});
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /target repository mismatch/);
});
test('GitHub API error fails closed', () => {
  const r = run('open', {error:true});
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /HTTP 403/);
});

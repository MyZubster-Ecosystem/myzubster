const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-onboarding.html'),'utf8');
const start=html.indexOf('const publicGithubSourceUrl=');
const end=html.indexOf('let sourceCount=0;',start);
if(start<0||end<start)throw Error('Public GitHub URL normalizer missing');
const publicGithubSourceUrl=new Function(html.slice(start,end)+';return publicGithubSourceUrl;')();
describe('Zorgax Knowledge Card GitHub evidence import',()=>{
 const security='https://github.com/MyZubster-Ecosystem/myzubster-space-station/commit/3eb0c7d050428eb63077c8926dcb3ab03d9204d5';
 test('imports the real manually declared Space Station security commit',()=>{
  expect(publicGithubSourceUrl(security)).toBe(security);
 });
 test('supports the existing first Knowledge Card commit and public PRs',()=>{
  const commit='https://github.com/myzubster/Myzubster/commit/7309fdc0261e7e00d92f577d15b46884290b6cb5';
  expect(publicGithubSourceUrl(commit)).toBe(commit);
  expect(publicGithubSourceUrl('https://github.com/monero-project/monero-docs/pull/389')).toBe('https://github.com/monero-project/monero-docs/pull/389');
 });
 test('rejects unrelated or malformed links, tracking queries and non-public endpoints',()=>{
  for(const x of ['https://evil.example/owner/repo/commit/3eb0c7d050428eb63077c8926dcb3ab03d9204d5','http://github.com/owner/repo/pull/3','https://github.com/owner/repo/issues/3','https://github.com/owner/repo/pull/3?access_token=abc'])expect(publicGithubSourceUrl(x)).toBe('');
 });
 test('imports the card source without changing existing README replacement or author approval',()=>{
  expect(html).toContain('sourceCount++');
  expect(html).toContain('sourceCount+');
  expect(html).toContain('current.slice(0,start)+section+current.slice(end+KNOWLEDGE_BLOCK_END.length)');
  expect(html).toContain('githubFinalApprove.checked=false');
 });
});

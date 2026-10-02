const fs=require('fs'),path=require('path');const read=n=>fs.readFileSync(path.join(__dirname,'..','public',n),'utf8');
describe('GitHub evidence on Knowledge Card and README',()=>{
 test('the builder offers owner-selected GitHub PR or commit linking',()=>{
  const s=read('zorgax-profile-builder.html');
  expect(s).toContain('id="githubCardEvidencePanel"');
  expect(s).toContain("'/api/knowledge-evidence/drafts/'+encodeURIComponent(id)+'/github-evidence'");
  expect(s).toContain("body:JSON.stringify({url,confirm:true})");
  expect(s).toContain('Fonte GitHub pubblica accessibile e collegata');
 });
 test('Zorgax README synchronization shows recorded contribution sources',()=>{
  const s=read('zorgax-profile-onboarding.html');
  expect(s).toContain("'Fonte GitHub'");
  expect(s).toContain('publicGithubSourceUrl');
  expect(s).toContain('MYZUBSTER-KNOWLEDGE-CARDS:START');
  expect(s).toContain("githubFinalApprove.checked=false;saveGithubFinalDraft()");
 });
});

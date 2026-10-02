const fs=require('fs');const path=require('path');const html=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-onboarding.html'),'utf8');
describe('Knowledge Card to GitHub sync',()=>{
 test('visible entry point is in knowledge onboarding, not hidden GitHub preview',()=>{
  const entry=html.indexOf('id="importPublishedKnowledge"');
  expect(entry).toBeGreaterThan(html.indexOf('id="knowledgeOnboardingCard"'));
  expect(entry).toBeLessThan(html.indexOf('id="snapshotCard"'));
 });
 test('imports published cards owned by signed-in MyZubster username',()=>{
  expect(html).toContain("c.publisherName===authenticatedMyzUsername");
  expect(html).toContain("github.readOnly===true?loginFromGithubValue():''");
  expect(html).toContain("githubSnapshot.profile.login.toLowerCase()!==linked.toLowerCase()");
  expect(html).toContain('MYZUBSTER-KNOWLEDGE-CARDS:START');
  expect(html).toContain('Stato verifica: ');
 });
 test('does not make an automatic GitHub write',()=>{
  expect(html).toContain('githubFinalApprove.checked=false;saveGithubFinalDraft()');
  expect(html).toContain('Confermo esplicitamente questa anteprima');
  expect(html).toContain("if(!githubFinalApprove.checked)");
 });
});

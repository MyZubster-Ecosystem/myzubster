const fs=require('fs');
const path=require('path');
const page=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-onboarding.html'),'utf8');
describe('published MyZubster Knowledge Card to GitHub README draft',()=>{
 test('requires authenticated account and verified GitHub snapshot',()=>{
  expect(page).toContain("authenticatedMyzUsername=String(data.data?.user?.username||'')");
  expect(page).toContain("githubSnapshot.partial===true");
  expect(page).toContain("githubSnapshot.profile.login.toLowerCase()!==linked.toLowerCase()");
 });
 test('only selects own published cards and leaves publication to the existing approval',()=>{
  expect(page).toContain("c.publisherName===authenticatedMyzUsername");
  expect(page).toContain("<!-- MYZUBSTER-KNOWLEDGE-CARDS:START -->");
  expect(page).toContain("<!-- MYZUBSTER-KNOWLEDGE-CARDS:END -->");
  expect(page).toContain("githubFinalApprove.checked=false");
  expect(page).toContain("if(!githubFinalApprove.checked)");
  expect(page).toContain("/api/auth/github/automation/apply");
 });
});

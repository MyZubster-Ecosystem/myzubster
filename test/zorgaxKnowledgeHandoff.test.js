const fs=require('fs');
const path=require('path');
const onboarding=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-onboarding.html'),'utf8');
const builder=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-builder.html'),'utf8');

describe('Zorgax to Knowledge Card handoff',()=>{
 test('starts from the authenticated profile flow and keeps GitHub identity separate from skills',()=>{
  expect(onboarding).toContain('id="knowledgeOnboardingCard"');
  expect(onboarding).toContain("github.readOnly===true?loginFromGithubValue():''");
  expect(onboarding).toContain("sessionStorage.setItem('myzubster-knowledge-onboarding-handoff-v1'");
  expect(onboarding).toContain("window.location.assign('/zorgax-profile-builder?from=onboarding')");
 });
 test('requires the user to review, import and save a private card',()=>{
  expect(builder).toContain('id="knowledgeHandoffPanel"');
  expect(builder).toContain("document.getElementById('importKnowledgeHandoff').onclick");
  expect(builder).toContain("if(!token()){showDraftLogin();return}");
  expect(builder).toContain('NON salvata');
  expect(builder).toContain("sessionStorage.removeItem(KNOWLEDGE_HANDOFF_KEY)");
  expect(builder).toContain("document.getElementById('saveDraft').onclick=saveDraft");
 });
});

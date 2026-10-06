const fs=require('fs');const path=require('path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
describe('visible knowledge onboarding',()=>{
 test('React home navigation links to Zorgax knowledge section',()=>{
  const app=read('frontend/src/App.js');
  expect(app).toContain('🧠 Aggiungi le tue conoscenze');
  expect(app).toContain('href="/zorgax-profile-onboarding#knowledgeOnboardingCard"');
 });
 test('Zorgax homepage and profile onboarding give direct access',()=>{
  const home=read('public/index.html'),zorgax=read('public/zorgax.html'),profile=read('public/zorgax-profile-onboarding.html');
  expect(home).toContain('🧠 Aggiungi le tue conoscenze');
  expect(zorgax).toContain('zorgax_to_knowledge_builder');
  expect(profile).toContain('href="#knowledgeOnboardingCard"');
  expect(profile).toContain('id="knowledgeOnboardingCard"');
 });
});

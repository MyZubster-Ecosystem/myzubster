const fs=require('fs');
const path=require('path');

describe('Profile onboarding guided Zorgax chat',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-onboarding.html'),'utf8');
  test('uses stable assistant chat endpoint everywhere in onboarding',()=>{
    expect(source).not.toContain("fetch('/api/zorgax/chat'");
    expect(source.split("fetch('/api/zorgax/assistant/chat'").length-1).toBeGreaterThanOrEqual(2);
    expect(source).toContain("Risposta Zorgax non valida. Riprova tra poco.");
    expect(source).toContain("if(!r.ok||!data.ok)");
  });
});

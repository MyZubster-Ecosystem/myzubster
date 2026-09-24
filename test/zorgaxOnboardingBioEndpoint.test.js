const fs=require('fs');
const path=require('path');

describe('Profile onboarding bio generation',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-onboarding.html'),'utf8');
  test('uses the stable assistant chat endpoint and guards malformed responses',()=>{
    expect(source).toContain("fetch('/api/zorgax/assistant/chat'");
    expect(source).not.toContain("fetch('/api/zorgax/chat'");
    expect(source).toContain("const raw=await r.text()");
    expect(source).toContain("Risposta Zorgax non valida. Riprova tra poco.");
    expect(source).toContain("if(!r.ok||!d.ok)");
  });
});

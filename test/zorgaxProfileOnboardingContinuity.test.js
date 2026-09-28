const fs=require('fs');
const path=require('path');

describe('Zorgax profile onboarding continuity',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-onboarding.html'),'utf8');

  test('turns an expired authenticated session into a safe re-login handoff',()=>{
    expect(source).toContain('function isExpiredAuthResponse');
    expect(source).toContain("localStorage.removeItem('myzubster-token')");
    expect(source).toContain("sessionStorage.setItem('myzubster-login-return-to','/zorgax-profile-onboarding')");
    expect(source).toContain('Riaccedi senza perdere la bozza e la conversazione.');
    expect(source).toContain('if(isExpiredAuthResponse(r,data)){showExpiredSession(status);return;}');
  });

  test('passes previous turns as supported assistant history and avoids repeated questions',()=>{
    expect(source).toContain("const recentHistory=chatHistory.slice(-10).map");
    expect(source).toContain("history:recentHistory");
    expect(source).toContain('non ripetere una domanda già risposta');
    expect(source).toContain('prepara una bozza professionale modificabile e salvabile privatamente');
    expect(source).toContain('BOZZA PROFILO PRIVATO');
    expect(source).toContain('function captureProfessionalProfileDraft');
    expect(source).toContain('captureProfessionalProfileDraft(text)');
    expect(source).toContain('resta non salvata finché non scegli Approva e salva privato');
  });
});

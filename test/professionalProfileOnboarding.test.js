'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax professional profile onboarding save flow', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../public/zorgax-profile-onboarding.html'),
    'utf8'
  );

  test('keeps questionnaire questions focused on the user', () => {
    expect(source).toContain("stai intervistando l'utente sul SUO profilo professionale");
    expect(source).toContain("Non rispondere mai alle domande del questionario come se fossero rivolte a te/Zorgax");
    expect(source).toContain("Non attribuire all'utente capacità di Zorgax");
  });

  test('requires an explicit approval action before profile persistence', () => {
    expect(source).toContain("Approva e salva privato");
    expect(source).toContain("Approva e pubblica su MyZubster");
    expect(source).toContain("JSON.stringify({approved:true,visibility,profile:professionalProfileDraft})");
    expect(source).toContain("/api/auth/profile/professional");
  });

  test('imports approved drafts from the URL fragment and removes them from the address bar', () => {
    expect(source).toContain("location.hash");
    expect(source).toContain("hash.get('profile')");
    expect(source).toContain("history.replaceState(null,'',location.pathname+location.search)");
  });

  test('inline onboarding script has valid JavaScript syntax', () => {
    const match = source.match(/<script>\s*([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    expect(() => new Function(match[1])).not.toThrow();
  });
});

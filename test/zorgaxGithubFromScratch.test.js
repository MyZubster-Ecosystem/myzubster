const fs = require('fs');
const path = require('path');

describe('Zorgax GitHub from-scratch onboarding', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'zorgax-profile-onboarding.html'), 'utf8');

  test('shows a clear create-from-scratch path before GitHub is linked', () => {
    expect(source).toContain('Crea GitHub da zero');
    expect(source).toContain('Ho già GitHub: collegalo');
    expect(source).toContain('profile_onboarding_github_create_from_scratch');
    expect(source).toContain('Zorgax leggerà solo i dati verificati');
  });

  test('hides the from-scratch helper after a verified GitHub profile is detected', () => {
    expect(source).toContain("document.getElementById('githubFromScratchHelp')");
    expect(source).toContain('fromScratchHelp.hidden=true');
  });
});

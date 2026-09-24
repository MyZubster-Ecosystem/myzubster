'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax professional profile save handoff', () => {
  const source = fs.readFileSync(path.join(__dirname, '../public/zorgax.html'), 'utf8');

  test('detects explicit MyZubster-only approval and opens the existing profile save flow', () => {
    expect(source).toContain('Approvo questa bozza solo per il salvataggio su MyZubster');
    expect(source).toContain('approvedMyzProfileDraft');
    expect(source).toContain('/zorgax-profile-onboarding.html#profile=');
    expect(source).toContain('Apri profilo e salva su MyZubster');
    expect(source).toContain('GitHub non verrà modificato');
  });

  test('keeps persistence behind the explicit onboarding approval buttons', () => {
    expect(source).toContain('renderProfessionalProfileHandoff(text)');
    expect(source).not.toContain("fetch('/api/auth/profile/professional'");
  });
});

const fs=require('fs');
const path=require('path');

describe('GitHub OAuth returns to profile onboarding',()=>{
  const source=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-onboarding.html'),'utf8');

  test('stores onboarding return path before GitHub linking and write authorization',()=>{
    const needle="sessionStorage.setItem('myzubster-login-return-to','/zorgax-profile-onboarding')";
    expect(source.split(needle).length-1).toBeGreaterThanOrEqual(2);
    expect(source).toContain('write_profile=1&myz_user=');
    expect(source).toContain('profile_onboarding_connect_github_click');
  });
});

const fs=require('fs');
const path=require('path');

describe('Full GitHub profile automation',()=>{
  test('write authorization requests profile write scope',()=>{
    const source=fs.readFileSync(path.join(__dirname,'..','src','controllers','socialAuthController.js'),'utf8');
    expect(source).toContain("writeProfile?'user repo':'read:user user:email'");
  });

  test('backend requires explicit approval and supports name bio README',()=>{
    const source=fs.readFileSync(path.join(__dirname,'..','src','routes','authRoutes.js'),'utf8');
    expect(source).toContain("req.body?.approved !== true");
    expect(source).toContain("updateProfile(token");
    expect(source).toContain("getProfileReadme(token");
    expect(source).toContain("/github/automation/rollback-profile");
  });

  test('onboarding persists a final draft and gates publication behind confirmation',()=>{
    const source=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-onboarding.html'),'utf8');
    expect(source).toContain("GITHUB_FINAL_DRAFT_KEY");
    expect(source).toContain("githubFinalApprove.checked");
    expect(source).toContain("approved:true");
    expect(source).toContain("captureGithubFinalPreview");
  });
});

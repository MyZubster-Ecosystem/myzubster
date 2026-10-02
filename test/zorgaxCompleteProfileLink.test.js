const fs=require('fs');
const path=require('path');

describe('Zorgax complete profile link',()=>{
  test('routes to the onboarding flow that supports GitHub from zero',()=>{
    const source=fs.readFileSync(path.join(__dirname,'..','public','zorgax.html'),'utf8');
    expect(source).toContain('href="/zorgax-profile-onboarding.html">👤 Completa profilo</a>');
    expect(source).not.toContain('href="/zorgax-profile-builder.html">👤 Completa profilo</a>');
  });
});

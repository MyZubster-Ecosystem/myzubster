'use strict';

const fs = require('fs');
const path = require('path');

describe('Zorgax developer personal profile builder', () => {
  const source = fs.readFileSync(path.join(__dirname, '../public/zorgax-profile-builder.html'), 'utf8');

  test('provides a developer category instead of forcing an institution', () => {
    expect(source).toContain('<option value="developer">');
    expect(source).toContain("if(type.value==='developer')return");
    expect(source).toContain("professionalPanel.hidden=type.value!=='developer'");
  });

  test('requires preview and explicit owner confirmation before publishing', () => {
    expect(source).toContain("document.getElementById('professionalPreviewButton').onclick");
    expect(source).toContain("document.getElementById('professionalPublic').onclick=()=>saveApprovedProfessional('public')");
    expect(source).toContain("if(!professionalApprovedPreview)return");
    expect(source).toContain("JSON.stringify(p)!==JSON.stringify(professionalApprovedPreview)");
    expect(source).toContain("if(!confirm(visibility==='public'?");
    expect(source).toContain("JSON.stringify({approved:true,visibility,profile:p})");
  });

  test('uses the existing authenticated professional profile API, not knowledge card publishing', () => {
    expect(source).toContain("fetch('/api/auth/profile/professional',{method:'PUT',headers:headers()");
    expect(source).toContain("fetch('/api/auth/profile/professional',{headers:{Authorization:'Bearer '+token()}");
    expect(source).toContain('Carica profilo già salvato');
    expect(source).toContain('Esiste già un profilo professionale');
  });

  test('preserves previously stored professional data and hides Gmail approval for developers', () => {
    expect(source).toContain('experiences:professionalExistingDetails.experiences');
    expect(source).toContain('interests:professionalExistingDetails.interests');
    expect(source).toContain('professionalExistingDetails.skills.find');
    expect(source).toContain("gmailApproval.hidden=type.value==='developer'");
    expect(source).toContain('.btn[hidden],button[hidden]{display:none}');
  });

  test('inline script parses as valid JavaScript', () => {
    const match = source.match(/<script>\s*([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    expect(() => new Function(match[1])).not.toThrow();
  });
});

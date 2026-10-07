const fs=require('fs');
const path=require('path');

const html=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-builder.html'),'utf8');

describe('Daniel VPS knowledge Passport handoff',()=>{
  test('shows the prepared VPS card only for the linked Daniel GitHub identity',()=>{
    expect(html).toContain('id="danielVpsKnowledgePassport" hidden');
    expect(html).toContain("const DANIEL_VPS_ACCOUNT='danieldirimini-myzubster'");
    expect(html).toContain("linkedGithubLogin()!==DANIEL_VPS_ACCOUNT");
  });

  test('loads bounded evidence into the editable private Knowledge Card form',()=>{
    expect(html).toContain('id="loadDanielVpsKnowledge"');
    expect(html).toContain('VPS & Infrastructure Operations — MyZubster Contributor Verification Node');
    expect(html).toContain('https://github.com/MyZubster-Ecosystem/myzubster/pull/1540');
    expect(html).toContain('https://github.com/MyZubster-Ecosystem/myzubster/pull/1541');
    expect(html).toContain('https://github.com/MyZubster-Ecosystem/myzubster/pull/1542');
    expect(html).toContain('Knowledge: DOCUMENTED. Competence evidence: RECORDED. Technical checkpoint: TESTED.');
    expect(html).toContain('Bozza VPS caricata e modificabile, NON salvata.');
  });
});

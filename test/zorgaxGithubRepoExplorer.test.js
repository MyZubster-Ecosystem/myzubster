const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-builder.html'),'utf8');
describe('Public GitHub multi-repository evidence discovery',()=>{
 test('offers Monero, Tari, metaverse and custom repository without private access',()=>{
  for(const repo of ['DanielIoni-creator/monero-docs','DanielIoni-creator/my-monero-bounty','DanielIoni-creator/tari','MyZubster-Ecosystem/myzubster-space-station'])expect(html).toContain(repo);
  expect(html).toContain('id="githubCustomRepo"');
  expect(html).toContain('https://api.github.com/repos/');
 });
 test('filters by user-chosen author and does not silently attribute commits',()=>{
  expect(html).toContain("params.set('author',author)");
  expect(html).toContain('L’identità dell’autore e il contenuto delle modifiche devono essere esaminati');
  expect(html).toContain('Un fork non dimostra di per sé');
 });
 test('sets an evidence URL but requires existing explicit confirmation flow',()=>{
  expect(html).toContain("document.getElementById('githubEvidenceUrl').value='https://github.com/'");
  expect(html).toContain("document.getElementById('addGithubEvidence').onclick=addGithubEvidence");
  expect(html).toContain('Controllare questa fonte GitHub pubblica e collegarla alla Knowledge Card selezionata?');
 });
 test('inline browser scripts parse cleanly',()=>{
  for(const script of html.split('<script>').slice(1).map(s=>s.split('</script>')[0]))expect(()=>new Function(script)).not.toThrow();
 });
});

const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-onboarding.html'),'utf8');
const start=html.indexOf('const publicGithubSourceUrl='),end=html.indexOf('let documentCount=0;',start);
if(start<0||end<=start)throw Error('Evidence parser not found');
const {publicGithubSourceUrl,publicGithubDocumentUrl}=new Function(html.slice(start,end)+';return {publicGithubSourceUrl,publicGithubDocumentUrl};')();
describe('Monero contribution dossier in Knowledge Card README',()=>{
 test('public documentation dossier is imported only as declared documentation',()=>{
  const url='https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/contributions/daniel-ioni-monero-docs-wallet-rpc.md';
  expect(publicGithubDocumentUrl(url)).toBe(url);
  expect(publicGithubSourceUrl(url)).toBe('');
  expect(html).toContain('Documentazione dichiarata (non verificata indipendentemente)');
 });
 test('only valid public commit/PR URLs count as GitHub sources',()=>{
  expect(publicGithubSourceUrl('https://github.com/myzubster/Myzubster/commit/7309fdc0261e7e00d92f577d15b46884290b6cb5')).toContain('/commit/');
  expect(publicGithubDocumentUrl('https://github.com/x/y/commit/'+'a'.repeat(40))).toBe('');
 });
 test('rejects private-looking or injected URLs and prevents double-counting',()=>{
  for(const url of ['https://github.com/x/y/blob/main/../private.md','https://github.com/x/y/blob/main/a.md?token=abc','https://evil.example/blob/main/a.md'])expect(publicGithubDocumentUrl(url)).toBe('');
  expect(html).toContain('if(e.isDocument)documentCount++;else sourceCount++');
 });
});

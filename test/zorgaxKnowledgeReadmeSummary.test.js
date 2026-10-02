const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','public','zorgax-profile-onboarding.html'),'utf8');
const start=source.indexOf('const clean=value=>'),end=source.indexOf('const lines=published.map',start);
if(start===-1||end===-1)throw Error('GitHub README summary missing');
const summarize=new Function(source.slice(start,end)+';return completeSummary;')();
describe('Zorgax Knowledge Card README summaries',()=>{
 test('never truncates an existing short note',()=>{
  const value='Attività dichiarate. Fonti pubbliche GitHub collegate. Competenze non certificate.';
  expect(summarize(value,200,'Vai alla scheda.')).toBe(value);
 });
 test('preserves only complete sentences within the display limit',()=>{
  const value='Attività dichiarate dal titolare. Almeno una fonte GitHub pubblica è stata collegata e ne è stata controllata la disponibilità. Contenuto, attribuzione e competenze non sono verificati indipendentemente.';
  const output=summarize(value,145,'Vai alla scheda.');
  expect(output).toBe('Attività dichiarate dal titolare. Almeno una fonte GitHub pubblica è stata collegata e ne è stata controllata la disponibilità.');
  expect(output).not.toMatch(/verifi$/);
 });
 test('links to full evidence if a single sentence exceeds its budget',()=>{
  expect(summarize('Troppo lungo '.repeat(100),90,'Dettagli completi nella scheda.')).toBe('Dettagli completi nella scheda.');
 });
 test('keeps the existing managed README block instead of appending duplicates',()=>{
  expect(source).toContain('current.slice(0,start)+section+current.slice(end+KNOWLEDGE_BLOCK_END.length)');
  expect(source).toContain('MYZUBSTER-KNOWLEDGE-CARDS:START');
  expect(source).toContain('completeSummary(e.note,420');
 });
});

const fs=require('fs');
const path=require('path');

describe('Circular project guided workflow',()=>{
  test('Zorgax exposes the circular project guided action',()=>{
    const source=fs.readFileSync(path.join(__dirname,'..','public','zorgax.html'),'utf8');
    expect(source).toContain('zorgax_intent_circular_project');
    expect(source).toContain('♻️ Crea progetto circolare');
    expect(source).toContain('foto');
    expect(source).toContain('GitHub collegato');
  });

  test('workflow documents approval, privacy and community handoff',()=>{
    const doc=fs.readFileSync(path.join(__dirname,'..','docs','CIRCULAR-PROJECT-WORKFLOW.md'),'utf8');
    expect(doc).toContain('Human approval');
    expect(doc).toContain('Photo review rules');
    expect(doc).toContain('Community issue template');
    expect(doc).toContain('Metaverse/Comics');
  });
});

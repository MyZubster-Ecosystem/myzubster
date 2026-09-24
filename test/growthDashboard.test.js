const fs=require('fs');
const path=require('path');

describe('Growth & Ecosystem dashboard',()=>{
  const page=fs.readFileSync(path.join(__dirname,'..','public','growth-dashboard.html'),'utf8');
  const data=JSON.parse(fs.readFileSync(path.join(__dirname,'..','public','data','growth.json'),'utf8'));
  const vercel=fs.readFileSync(path.join(__dirname,'..','vercel.json'),'utf8');

  test('keeps visibility, participation and adoption as separate evidence layers',()=>{
    expect(page).toContain('Visibility');
    expect(page).toContain('Participation');
    expect(page).toContain('Adoption');
    expect(page).toContain('single “popularity score”');
    expect(page).toContain("fetch('/data/growth.json'");
  });

  test('ships conservative public evidence with source links',()=>{
    expect(data.current.public_contributor_aliases_tracked).toBe(7);
    expect(data.current.external_web_social_mentions).toBe(4);
    expect(data.current.merged_external_showcase_contributions).toBe(2);
    expect(data.current.independent_integrations).toBe(0);
    expect(data.sources.length).toBeGreaterThanOrEqual(4);
    expect(data.methodology.privacy).toMatch(/passive visitors/i);
  });

  test('publishes the dashboard and dataset through Vercel routes',()=>{
    expect(vercel).toContain('"src":"/growth/?"');
    expect(vercel).toContain('"dest":"/public/growth-dashboard.html"');
    expect(vercel).toContain('"src":"/data/growth\\\\.json/?"');
    expect(vercel).toContain('"dest":"/public/data/growth.json"');
  });
});

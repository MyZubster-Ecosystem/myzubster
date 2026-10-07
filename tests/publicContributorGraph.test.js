const fs = require('fs');
const path = require('path');
const vm = require('vm');

// This is a public PR snapshot, not an owner-published Knowledge Card import.
const html = fs.readFileSync(path.join(__dirname, '../public/knowledge.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

describe('public contributor evidence graph', () => {
  test('inline graph script remains valid JavaScript', () => {
    expect(script).toBeTruthy();
    expect(() => new vm.Script(script)).not.toThrow();
  });

  test('keeps owner-published Knowledge Cards separate from public GitHub PR evidence', () => {
    expect(html).toContain("fetch('/api/knowledge-evidence/public',{cache:'no-store'})");
    expect(html).toContain('Evidenza GitHub · non una Knowledge Card');
    expect(html).toContain('work-node');
    expect(html).toContain('hardware-node');
    expect(html).toContain('Hardware evidence');
    expect(html).toContain('PR chiusa senza integrazione');
    expect(html).toContain('non certifica automaticamente una competenza');
    expect(html).not.toContain('localStorage');
    expect(html).not.toContain('githubContributions.map(w=>w.wallet)');
  });

  test('hardware evidence is explicit, bounded and separate from owner-published cards', () => {
    const match = script.match(/const hardwareKnowledgeNodes=(\[[\s\S]*?\]);\nfunction visibleHardware/);
    expect(match).not.toBeNull();
    const items = JSON.parse(match[1]);
    expect(items.map(item => item.id)).toEqual(['hkc-hw-001','hkc-hw-002','hkc-hw-003']);
    expect(items.every(item => item.status === 'DOCUMENTED')).toBe(true);
    expect(items.find(item => item.account === 'foxxx009').label).toMatch(/Arduino/i);
    expect(items.find(item => item.account === 'Aming9303').label).toMatch(/sensor/i);
    expect(html).toContain('non una Knowledge Card personale pubblicata dal titolare');
    expect(html).toContain('HARDWARE-KNOWLEDGE-CARDS.md');
  });

  test('curated evidence contains only public PR links and allows distinct PR states', () => {
    const match = script.match(/const githubContributions=(\[[^;]*\]);/);
    expect(match).not.toBeNull();
    const items = JSON.parse(match[1]);
    expect(items.length).toBeGreaterThanOrEqual(5);
    expect(new Set(items.map(item => item.url)).size).toBe(items.length);
    for (const item of items) {
      expect(item).toEqual({
        account: expect.any(String), title: expect.any(String),
        domain: expect.any(String),
        url: expect.stringMatching(/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/[1-9]\d*$/),
        status: expect.stringMatching(/^(merged|submitted|closed_without_merge)$/)
      });
    }
  });
});

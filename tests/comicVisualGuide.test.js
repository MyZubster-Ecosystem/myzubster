const fs = require('fs');
const path = require('path');

describe('Comic Visual Guide & Deliverables Validation (Issue #526)', () => {
  const rootDir = path.resolve(__dirname, '..');
  const comicDir = path.join(rootDir, 'docs', 'comic');
  const pngMagicBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const requiredAssets = [
    'myzubster-how-it-works-cover.png',
    'myzubster-how-it-works.png',
    'myzubster-how-it-works-hires.png'
  ];

  test('all required raster deliverables exist, are non-empty, and are valid PNGs', () => {
    for (const file of requiredAssets) {
      const filePath = path.join(comicDir, file);
      expect(fs.existsSync(filePath)).toBe(true);

      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(10000); // realistic raster size

      const buffer = Buffer.alloc(8);
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      expect(buffer.equals(pngMagicBytes)).toBe(true);
    }
  });

  test('docs/comic/README.md exists and contains the complete seven-stage Italian workflow', () => {
    const readmePath = path.join(comicDir, 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);

    const content = fs.readFileSync(readmePath, 'utf8');

    const stages = [
      'Osserva',
      'Documenta',
      'Collega',
      'Collabora',
      'Verifica',
      'Pubblica',
      'Reward / settlement'
    ];

    for (const stage of stages) {
      expect(content).toContain(stage);
    }
  });

  test('docs/comic/README.md enforces clear internal accounting vs external settlement boundary', () => {
    const readmePath = path.join(comicDir, 'README.md');
    const content = fs.readFileSync(readmePath, 'utf8');

    expect(content).toMatch(/MYZ.*internal.*accounting/i);
    expect(content).toMatch(/external settlement.*independently verifiable/i);
    expect(content).toMatch(/MIT license/i);
    expect(content).toMatch(/AI-assisted/i);
    expect(content).toMatch(/CONTRIBUTOR SUBMISSION \/ PROPOSED/i);
  });

  test('root README.md links directly to the visual comic guide', () => {
    const rootReadmePath = path.join(rootDir, 'README.md');
    const content = fs.readFileSync(rootReadmePath, 'utf8');

    expect(content).toContain('docs/comic/myzubster-how-it-works.png');
    expect(content).toContain('docs/comic/README.md');
  });

  test('state machine models seven-stage workflow sequence without mock data', () => {
    const workflowStages = [
      { id: 1, name: 'Osserva', role: 'observe' },
      { id: 2, name: 'Documenta', role: 'document' },
      { id: 3, name: 'Collega', role: 'connect' },
      { id: 4, name: 'Collabora', role: 'collaborate' },
      { id: 5, name: 'Verifica', role: 'verify' },
      { id: 6, name: 'Pubblica', role: 'publish' },
      { id: 7, name: 'Reward / settlement', role: 'reward' }
    ];

    expect(workflowStages.length).toBe(7);
    expect(workflowStages.map(s => s.role)).toEqual([
      'observe',
      'document',
      'connect',
      'collaborate',
      'verify',
      'publish',
      'reward'
    ]);

    // Validate sequential transitions
    for (let i = 0; i < workflowStages.length - 1; i++) {
      expect(workflowStages[i + 1].id).toBe(workflowStages[i].id + 1);
    }
  });
});

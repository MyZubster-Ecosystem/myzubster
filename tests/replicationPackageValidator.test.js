const fs = require('fs');
const os = require('os');
const path = require('path');
const { validateReplicationPackage } = require('../src/services/replicationPackageValidator');

const manifestPath = 'docs/life-2027/replication-package/v1.0.0/manifest.json';

describe('replication package validator', () => {
  test('accepts the complete versioned milestone package', () => {
    expect(validateReplicationPackage(path.resolve(__dirname, '..'), manifestPath)).toEqual({
      valid: true,
      errors: []
    });
  });

  test('reports an incomplete fixture deterministically', () => {
    const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'myz-replication-'));
    const sourceRoot = path.resolve(__dirname, '..');
    const manifest = JSON.parse(fs.readFileSync(path.join(sourceRoot, manifestPath), 'utf8'));

    for (const artifact of manifest.artifacts) {
      const target = path.join(fixtureRoot, artifact.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(sourceRoot, artifact.path), target);
    }
    for (const reference of manifest.auditReferences) {
      const target = path.join(fixtureRoot, reference.path);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(sourceRoot, reference.path), target);
    }

    manifest.artifacts[0].requiredMarkers.push('## Missing fixture section');
    manifest.auditReferences[0].path = 'docs/missing-reference.md';
    const targetManifest = path.join(fixtureRoot, manifestPath);
    fs.mkdirSync(path.dirname(targetManifest), { recursive: true });
    fs.writeFileSync(targetManifest, JSON.stringify(manifest, null, 2));

    const result = validateReplicationPackage(fixtureRoot, manifestPath);
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      'site-readiness-template missing marker: ## Missing fixture section',
      'audit reference not found: docs/missing-reference.md'
    ]);
  });
});

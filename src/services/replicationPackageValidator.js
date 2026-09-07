const fs = require('fs');
const path = require('path');

const REQUIRED_ARTIFACTS = new Set([
  'site-readiness-template',
  'replication-decision-matrix'
]);

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function validateReplicationPackage(repositoryRoot, manifestPath = 'docs/life-2027/replication-package/v1.0.0/manifest.json') {
  const errors = [];
  const absoluteManifestPath = path.resolve(repositoryRoot, manifestPath);
  let manifest;

  try {
    manifest = readJson(absoluteManifestPath);
  } catch (error) {
    return { valid: false, errors: [`manifest: ${error.message}`] };
  }

  if (!/^\d+\.\d+\.\d+$/.test(manifest.schemaVersion || '')) {
    errors.push('manifest.schemaVersion must be semantic version');
  }
  if (manifest.publicBoundary !== 'fictional-and-reusable-only') {
    errors.push('manifest.publicBoundary must exclude partner-specific inputs');
  }

  const artifacts = Array.isArray(manifest.artifacts) ? manifest.artifacts : [];
  const artifactIds = new Set(artifacts.map((artifact) => artifact.id));
  for (const requiredId of REQUIRED_ARTIFACTS) {
    if (!artifactIds.has(requiredId)) errors.push(`missing required artifact: ${requiredId}`);
  }

  for (const artifact of artifacts) {
    if (!artifact.id || !artifact.path || !artifact.version) {
      errors.push('each artifact requires id, path and version');
      continue;
    }
    const artifactPath = path.resolve(repositoryRoot, artifact.path);
    if (!fs.existsSync(artifactPath)) {
      errors.push(`artifact not found: ${artifact.path}`);
      continue;
    }
    const content = fs.readFileSync(artifactPath, 'utf8');
    for (const marker of artifact.requiredMarkers || []) {
      if (!content.includes(marker)) errors.push(`${artifact.id} missing marker: ${marker}`);
    }
  }

  for (const reference of manifest.auditReferences || []) {
    if (!reference.path || !fs.existsSync(path.resolve(repositoryRoot, reference.path))) {
      errors.push(`audit reference not found: ${reference.path || '(missing path)'}`);
    }
    if (!reference.boundary) errors.push(`audit reference missing boundary: ${reference.id || '(missing id)'}`);
  }

  return { valid: errors.length === 0, errors };
}

if (require.main === module) {
  const result = validateReplicationPackage(path.resolve(__dirname, '../..'), process.argv[2]);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.valid) process.exitCode = 1;
}

module.exports = { validateReplicationPackage };

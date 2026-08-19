const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const projectRoot = path.resolve(__dirname, '..');
const metadataPath = path.join(projectRoot, 'public', 'media', 'bots', 'metadata.json');
const avatarDir = path.dirname(metadataPath);

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

if (!fs.existsSync(metadataPath)) {
  console.error(`Metadata not found: ${metadataPath}`);
  process.exit(1);
}

const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
const agents = Array.isArray(metadata.agents) ? metadata.agents : [];

let failed = 0;

console.log(`MyZubster bot avatar verification (${agents.length} agents)`);
console.log(`MYZ model: ${metadata.myz?.model || 'unknown'}`);

for (const agent of agents) {
  const filePath = path.join(avatarDir, agent.fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`MISSING  ${agent.id}: ${agent.fileName}`);
    failed++;
    continue;
  }

  const stats = fs.statSync(filePath);
  const actualHash = sha256(filePath);
  const sizeOk = stats.size === agent.sizeBytes;
  const hashOk = actualHash === agent.sha256;

  if (sizeOk && hashOk) {
    console.log(`OK       ${agent.id}: ${agent.fileName}`);
  } else {
    console.error(`FAILED   ${agent.id}: ${agent.fileName}`);
    if (!sizeOk) console.error(`  size: expected ${agent.sizeBytes}, got ${stats.size}`);
    if (!hashOk) console.error(`  sha256: expected ${agent.sha256}, got ${actualHash}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\nAvatar verification failed: ${failed} issue(s).`);
  process.exit(1);
}

console.log('\nAll bot avatars verified successfully.');
console.log('Note: MYZ is an internal platform ledger unit; this metadata does not imply payment or settlement.');

const express = require('express');

const router = express.Router();

// The integration is intentionally report-only: MyZubster never launches
// Metasploit modules or executes payloads. Findings are imported from an
// externally controlled, authorized security-assessment environment.
const enabled = process.env.METASPLOIT_INTEGRATION_ENABLED === 'true';

function normalizeFinding(finding) {
  if (!finding || typeof finding !== 'object') return null;

  return {
    id: String(finding.id || finding.name || 'unknown'),
    name: String(finding.name || finding.title || 'Unnamed finding'),
    severity: String(finding.severity || 'unknown').toLowerCase(),
    host: finding.host ? String(finding.host) : null,
    port: finding.port != null ? Number(finding.port) : null,
    protocol: finding.protocol ? String(finding.protocol) : null,
    cve: finding.cve ? String(finding.cve) : null,
    description: finding.description ? String(finding.description) : null,
    source: 'metasploit'
  };
}

router.get('/status', (_req, res) => {
  res.json({
    provider: 'metasploit-framework',
    enabled,
    mode: 'report-import-only',
    execution_enabled: false
  });
});

router.post('/import', (req, res) => {
  if (!enabled) {
    return res.status(503).json({
      error: 'Metasploit integration is disabled',
      provider: 'metasploit-framework'
    });
  }

  const findings = Array.isArray(req.body?.findings) ? req.body.findings : [];
  if (findings.length > 1000) {
    return res.status(413).json({ error: 'Too many findings in one import' });
  }

  const normalized = findings.map(normalizeFinding).filter(Boolean);

  return res.status(202).json({
    provider: 'metasploit-framework',
    imported: normalized.length,
    findings: normalized
  });
});

module.exports = router;

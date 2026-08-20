const fs = require('fs');
const path = require('path');

describe('telemetry dashboard DOM safety', () => {
  const dashboardPath = path.join(
    __dirname,
    '..',
    'frontend',
    'dashboard-public',
    'telemetry.html'
  );
  const dashboard = fs.readFileSync(dashboardPath, 'utf8');

  test('does not use HTML injection sinks for API-controlled data', () => {
    expect(dashboard).not.toMatch(/\.(?:innerHTML|outerHTML)\s*=/);
    expect(dashboard).not.toMatch(/\.insertAdjacentHTML\s*\(/);
    expect(dashboard).not.toMatch(/\bdocument\.write\s*\(/);
  });

  test('renders telemetry values through DOM text nodes', () => {
    expect(dashboard).toContain("badge.textContent = safeValue");
    expect(dashboard).toContain("cell.textContent = String(value)");
    expect(dashboard).toContain("rows.replaceChildren(fragment)");
  });
});


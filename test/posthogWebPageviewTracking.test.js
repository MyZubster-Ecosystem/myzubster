const fs = require('fs');
const path = require('path');

describe('PostHog web pageview instrumentation', () => {
  const server = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');

  test('captures privacy-safe HTML navigations as $pageview', () => {
    expect(server).toContain("event: '$pageview'");
    expect(server).toContain("$current_url");
    expect(server).toContain("$pathname");
    expect(server).toContain("$session_id");
    expect(server).toContain("analyticsScope: 'html-navigation'");
  });

  test('does not instrument API requests as pageviews', () => {
    expect(server).toContain("req.path.startsWith('/api/')");
    expect(server).toContain("accept.includes('text/html')");
  });
});

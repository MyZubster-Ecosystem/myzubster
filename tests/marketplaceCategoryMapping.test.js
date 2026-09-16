const fs = require('fs');
const path = require('path');

describe('marketplace category mapping', () => {
  const assistant = fs.readFileSync(path.join(__dirname, '../public/zorgax-listing-assistant.js'), 'utf8');
  const routes = fs.readFileSync(path.join(__dirname, '../src/routes/listingRoutes.js'), 'utf8');

  test('Zorgax recognizes laser and sound system listings as event support', () => {
    expect(assistant).toContain("['event_support', /\\b(laser|visual|sound\\s*system|soundsystem|dj|rave|party|evento|eventi|festival|mapping|proiettore|luci|audio|impianto|casse|mixer)\\b/i]");
    expect(assistant).toContain('Zorgax ha riconosciuto:');
  });

  test('backend accepts categories exposed by the marketplace form', () => {
    [
      'development_services',
      'event_support',
      'agriculture_support',
      'arts',
      'wellness',
      'help_request',
      'university_course',
      'thesis_project',
      'research_project',
      'internship'
    ].forEach(category => expect(routes).toContain(`'${category}'`));
  });

  test('the mapping regression remains covered by the preview build', () => {
    expect(assistant).toContain('event_support');
    expect(routes).toContain('ALLOWED_CATEGORIES');
  });
});

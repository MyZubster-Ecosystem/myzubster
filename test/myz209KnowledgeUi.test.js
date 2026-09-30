const fs = require('fs');
const path = require('path');

describe('MYZ-209 knowledge account UI', () => {
  const builder = fs.readFileSync(path.join(__dirname, '..', 'public', 'zorgax-profile-builder.html'), 'utf8');
  const home = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

  test('hides the login prompt after the authenticated draft list loads', () => {
    expect(builder).toContain("function hideDraftLogin(){document.getElementById('draftLogin').hidden=true}");
    expect(builder).toContain("hideDraftLogin();knowledgeDrafts=d.drafts||[];");
  });

  test('offers the signed-in account a personal knowledge link', () => {
    expect(home).toContain('<a href="/zorgax-profile-builder">Le mie conoscenze</a>');
  });
});

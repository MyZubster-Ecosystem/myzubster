const fs = require('fs');
const path = require('path');

test('the Metaverse direction card navigates to the implemented route', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../frontend/src/App.js'),
    'utf8'
  );

  expect(source).toMatch(
    /if\s*\(\s*choice\s*===\s*['"]world['"]\s*\)\s*\{\s*window\.location\.assign\(['"]\/metaverse['"]\);\s*return;\s*\}/
  );
  expect(source).toMatch(
    /onClick=\{\(\)\s*=>\s*window\.location\.assign\(['"]\/metaverse['"]\)\}[^>]*>\s*\{t\.(?:metaverse|enter)\}/
  );
});

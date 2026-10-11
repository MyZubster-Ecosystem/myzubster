const fs = require('fs');
const path = require('path');

test('the Metaverse direction card navigates to the implemented route', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '../frontend/src/App.js'),
    'utf8'
  );

  expect(source).toContain(
    "if(choice==='world'){window.location.assign('/metaverse');return;}"
  );
  expect(source).toContain(
    "<button onClick={()=>window.location.assign('/metaverse')}>{t.enter}</button>"
  );
});

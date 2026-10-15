const fs = require('fs');
const path = require('path');

describe('my pilots production route contract', () => {
  const html = fs.readFileSync(path.join(__dirname, '../public/my-pilots.html'), 'utf8');

  test('uses the mounted /api/my-pilots API path', () => {
    expect(html).toContain("fetch('/api/my-pilots'");
    expect(html).toContain("fetch('/api/my-pilots/'+p._id+'/devices'");
    expect(html).not.toContain('/api/personal-pilots');
  });
});

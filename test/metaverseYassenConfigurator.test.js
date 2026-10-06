'use strict';

const fs = require('fs');
const path = require('path');

describe('Yassen metaverse configurator', () => {
  const scriptPath = path.join(__dirname, '../scripts/metaverse/configure-yassen.js');
  const packagePath = path.join(__dirname, '../package.json');
  const source = fs.readFileSync(scriptPath, 'utf8');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  test('exposes the bounded operator command', () => {
    expect(packageJson.scripts['metaverse:configure:yassen'])
      .toBe('node scripts/metaverse/configure-yassen.js');
  });

  test('targets Yassen public GitHub identity and default character profile', () => {
    expect(source).toContain("const VERIFIED_GITHUB_LOGIN = 'yassenmainardi'");
    expect(source).toContain("const CHARACTER_NAME = 'Yassen'");
    expect(source).toContain("const ARCHETYPE = 'explorer'");
    expect(source).toContain("const WORLD_ID = 'neon-plaza'");
  });

  test('fails closed without an existing verified GitHub-linked account', () => {
    expect(source).toContain("User.findOne({ 'github.login': VERIFIED_GITHUB_LOGIN })");
    expect(source).toContain('if (!user || !user.github?.id)');
    expect(source).toContain('must complete the normal GitHub account-link flow');
  });

  test('creates only an account-linked GitHub character and is idempotent', () => {
    expect(source).toContain("identityStatus: 'account-linked'");
    expect(source).toContain("createdFrom: 'account-github'");
    expect(source).toContain('{ new: true, upsert: true, runValidators: true }');
  });
});

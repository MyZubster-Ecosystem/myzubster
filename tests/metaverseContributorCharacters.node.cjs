const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { eligibleChoices, publicVisual } = require('../backend/src/services/contributorCharacters');

test('actual character and presence schemas preserve the avatar with no active emote', () => {
  const Character = require('../backend/src/models/MetaverseCharacter');
  const Presence = require('../backend/src/models/MetaversePresence');
  const character = new Character(wasim({ visualKey: 'wasim' }));
  assert.equal(character.validateSync(), undefined);
  const presence = new Presence({
    sessionId: 'schema-test', ...wasim({ visualKey: 'wasim' }),
    x: 50, y: 50, expiresAt: new Date()
  });
  assert.equal(presence.emote, null);
  assert.equal(presence.validateSync(), undefined);
  assert.equal(publicVisual(Presence.hydrate(presence.toObject())).avatarUrl, '/images/characters/wasim.svg');
});

function wasim(overrides = {}) {
  return {
    characterId: 'account-user1', displayName: 'Wasim', characterName: 'Wasim',
    archetype: 'explorer', identityStatus: 'account-linked', worldId: 'neon-plaza',
    github: { id: '108329802', login: 'wasim-builds', profileUrl: 'https://github.com/wasim-builds' },
    missionProgress: { visitedLandmarks: ['identity'] },
    ...overrides
  };
}

// Exercise the real route handlers with isolated storage doubles. No production
// database, credentials or network calls are used.
function harness(character) {
  const handlers = new Map();
  const presences = new Map();
  let saves = 0;
  if (character) character.save = async () => { saves++; return character; };
  const query = rows => ({
    select() { return this; }, sort() { return this; }, limit() { return this; },
    lean: async () => rows
  });
  const router = {
    use() {},
    get(route, ...callbacks) { handlers.set('GET ' + route, callbacks.at(-1)); },
    post(route, ...callbacks) { handlers.set('POST ' + route, callbacks.at(-1)); }
  };
  const dependencies = {
    express: { Router: () => router },
    crypto: require('node:crypto'),
    mongoose: { connection: { readyState: 1 } },
    '../models/MetaverseCharacter': {
      findOneAndUpdate: async filter => filter.accountUserId === 'user1' ? character : null,
      distinct: async () => character ? [character.characterName] : [],
      find: () => query(character ? [character] : []),
      create: async () => {}
    },
    '../models/MetaversePresence': {
      find: () => query([...presences.values()]),
      findOne: () => ({ lean: async () => [...presences.values()][0] || null }),
      findOneAndUpdate: async (filter, update) => {
        presences.set(filter.sessionId, { sessionId: filter.sessionId, ...update.$set });
      }
    },
    '../models/MetaverseChatMessage': { find: () => query([]) },
    '../services/contributorCharacters': { eligibleChoices, publicVisual },
    '../../../src/middleware/auth': { authenticate() {}, optionalAuthenticate() {} }
  };
  const filename = path.join(__dirname, '../backend/src/routes/metaverse.js');
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    require: name => {
      assert.ok(Object.hasOwn(dependencies, name), 'Unexpected dependency: ' + name);
      return dependencies[name];
    },
    module: { exports: {} }, console, process, setTimeout, clearTimeout, setInterval, clearInterval
  }, { filename });
  return {
    saves: () => saves,
    presences,
    async call(method, route, body = {}, userId = 'user1') {
      const response = { statusCode: 200 };
      const res = {
        status(code) { response.statusCode = code; return this; },
        json(payload) { response.body = JSON.parse(JSON.stringify(payload)); return this; }
      };
      await handlers.get(method + ' ' + route)({ body, userId }, res);
      return response;
    }
  };
}

test('only the original verified GitHub identity can choose WASIM', () => {
  assert.equal(eligibleChoices(wasim()).length, 1);
  for (const character of [
    wasim({ identityStatus: 'guest' }),
    wasim({ github: { login: 'wasim-builds', id: 'another-id' } }),
    wasim({ github: { login: 'another-user', id: '108329802' } }),
    wasim({ github: null })
  ]) {
    assert.equal(eligibleChoices(character).length, 0);
    assert.deepEqual(publicVisual({ ...character, visualKey: 'wasim' }), {});
  }
});

test('the owner opts in; profile, join, shared presence and featured list retain the original avatar', async () => {
  const character = wasim();
  const h = harness(character);
  const before = await h.call('GET', '/profile');
  assert.equal(before.body.character.avatarUrl, undefined);
  assert.equal(before.body.characterChoices[0].key, 'wasim');
  const selected = await h.call('POST', '/character', { characterKey: 'wasim', avatarUrl: 'https://untrusted.test/image.svg' });
  assert.equal(selected.statusCode, 200);
  assert.equal(h.saves(), 1);
  assert.equal(character.characterName, 'WASIM');
  assert.deepEqual(character.missionProgress.visitedLandmarks, ['identity']);
  const profile = await h.call('GET', '/profile');
  assert.equal(profile.body.character.avatarUrl, '/images/characters/wasim.svg');
  const joined = await h.call('POST', '/join', { characterName: 'Forged', visualKey: 'other' });
  assert.equal(joined.statusCode, 201);
  assert.equal(joined.body.player.characterName, 'WASIM');
  assert.equal(joined.body.player.characterReviewStatus, 'proposed');
  assert.equal(joined.body.player.github.id, undefined);
  assert.equal([...h.presences.values()][0].visualKey, 'wasim');
  const sync = await h.call('POST', '/sync', { sessionId: joined.body.sessionId });
  assert.equal(sync.body.players[0].avatarUrl, profile.body.character.avatarUrl);
  const world = await h.call('GET', '/world');
  assert.equal(world.body.featuredCharacters[0].avatarUrl, profile.body.character.avatarUrl);
});

test('selection rejects another account, a missing linked character and unknown keys', async () => {
  const other = harness(wasim({ github: { id: '123', login: 'another-user' } }));
  assert.equal((await other.call('POST', '/character', { characterKey: 'wasim', github: { login: 'wasim-builds' } })).statusCode, 403);
  assert.equal(other.saves(), 0);
  const owner = harness(wasim());
  assert.equal((await owner.call('POST', '/character', { characterKey: '__proto__' })).statusCode, 403);
  assert.equal(owner.saves(), 0);
  assert.equal((await harness(null).call('POST', '/character', { characterKey: 'wasim' })).statusCode, 404);
});

test('guest cannot claim a contributor avatar by supplying its name, key or GitHub identity', async () => {
  const h = harness(null);
  const joined = await h.call('POST', '/join', {
    displayName: 'Wasim', characterName: 'WASIM', visualKey: 'wasim',
    avatarUrl: '/images/characters/wasim.svg',
    github: { login: 'wasim-builds', id: '108329802' }
  }, null);
  assert.equal(joined.statusCode, 201);
  assert.equal(joined.body.player.identityStatus, 'guest');
  assert.equal(joined.body.player.avatarUrl, undefined);
  assert.equal(joined.body.player.github, null);
});

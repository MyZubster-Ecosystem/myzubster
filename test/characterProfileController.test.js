jest.mock('../src/models/User', () => ({}));

const { normalizeCharacterProfile } = require('../src/controllers/characterProfileController');

describe('character profile validation', () => {
  test('normalizes a valid profile', () => {
    expect(normalizeCharacterProfile({
      name: '  Nova  ',
      archetype: 'Guardian',
      role: 'Contributor',
      guidingValue: 'Truth'
    })).toEqual({
      name: 'Nova',
      archetype: 'guardian',
      role: 'contributor',
      guidingValue: 'truth'
    });
  });

  test.each([
    [{ name: 'N', archetype: 'guardian', role: 'observer', guidingValue: 'care' }, 'nome'],
    [{ name: 'Nova', archetype: 'hacker', role: 'observer', guidingValue: 'care' }, 'Archetipo'],
    [{ name: 'Nova', archetype: 'guardian', role: 'boss', guidingValue: 'care' }, 'Ruolo'],
    [{ name: 'Nova', archetype: 'guardian', role: 'observer', guidingValue: 'power' }, 'Valore']
  ])('rejects invalid character data', (payload, expectedMessage) => {
    expect(() => normalizeCharacterProfile(payload)).toThrow(expectedMessage);
  });
});

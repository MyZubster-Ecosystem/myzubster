const {
  LocationPrivacyError,
  prepareLocation,
  decryptExactLocation,
  projectPublicLocation,
  buildNftLocationMetadata
} = require('../src/services/locationPrivacyService');

describe('location privacy service', () => {
  const originalKey = process.env.LOCATION_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.LOCATION_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString('base64');
  });

  afterAll(() => {
    if (originalKey === undefined) delete process.env.LOCATION_ENCRYPTION_KEY;
    else process.env.LOCATION_ENCRYPTION_KEY = originalKey;
  });

  test('encrypts exact coordinates and exposes only an approximate projection by default', () => {
    const result = prepareLocation({
      lat: 44.0637353,
      lng: 12.5678873,
      address: 'Via privata 1',
      city: 'Rimini',
      country: 'IT',
      consentGranted: true
    });

    expect(result.publicLocation).toMatchObject({
      visibility: 'approximate',
      precision: 'approx-1km',
      lat: 44.06,
      lng: 12.57,
      city: 'Rimini',
      country: 'IT'
    });
    expect(result.publicLocation.address).toBeUndefined();
    expect(JSON.stringify(result.privateLocation)).not.toContain('Via privata 1');
    expect(decryptExactLocation(result.privateLocation)).toMatchObject({
      lat: 44.0637353,
      lng: 12.5678873,
      address: 'Via privata 1'
    });
  });

  test('private visibility exposes no coordinates or city', () => {
    const result = prepareLocation({
      lat: 44.0637353,
      lng: 12.5678873,
      city: 'Rimini',
      country: 'IT',
      visibility: 'private',
      consentGranted: true
    });

    expect(projectPublicLocation(result.publicLocation)).toEqual({
      visibility: 'private',
      precision: 'hidden',
      country: 'IT'
    });
  });

  test('requires explicit consent for new location data', () => {
    expect(() => prepareLocation({ lat: 44, lng: 12 })).toThrow(LocationPrivacyError);
    expect(() => prepareLocation({ lat: 44, lng: 12 })).toThrow('explicit location consent is required');
  });

  test('fails closed when the encryption key is missing', () => {
    delete process.env.LOCATION_ENCRYPTION_KEY;
    expect(() => prepareLocation({ lat: 44, lng: 12, consentGranted: true }))
      .toThrow('LOCATION_ENCRYPTION_KEY is required');
  });

  test('NFT metadata never includes exact coordinates or address', () => {
    const result = prepareLocation({
      lat: 44.0637353,
      lng: 12.5678873,
      address: 'Via privata 1',
      city: 'Rimini',
      country: 'IT',
      visibility: 'public',
      consentGranted: true
    });
    const metadata = buildNftLocationMetadata(result.publicLocation, result.privateLocation);

    expect(metadata).toMatchObject({ visibility: 'public', city: 'Rimini', country: 'IT' });
    expect(metadata.commitment).toMatch(/^[a-f0-9]{64}$/);
    expect(metadata.lat).toBeUndefined();
    expect(metadata.lng).toBeUndefined();
    expect(metadata.address).toBeUndefined();
  });
});

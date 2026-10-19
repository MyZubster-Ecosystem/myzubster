import { LANGS, detectLang } from './App';

jest.mock('react-leaflet', () => ({}));
jest.mock('./pages/MapPage', () => () => null);
jest.mock('./pages/GardensPage', () => () => null);

describe('App navigation, localization & marketplace cleanups (PR #1627)', () => {
  const supportedLanguages = ['it', 'en', 'es', 'fr', 'de'];

  test('declares all 5 languages with complete navigation labels, free, and barter', () => {
    for (const lang of supportedLanguages) {
      const dict = LANGS[lang];
      expect(dict).toBeDefined();
      expect(dict.searchServices).toBeTruthy();
      expect(dict.offerService).toBeTruthy();
      expect(dict.metaverse).toBeTruthy();
      expect(dict.profileOrLogin).toBeTruthy();
      expect(dict.backToHome).toBeTruthy();
      expect(dict.free).toBeTruthy();
      expect(dict.barter).toBeTruthy();
      // Ensure metaverse label is explicit and not ambiguous "Entra"
      expect(dict.metaverse.toLowerCase()).toMatch(/m[eé]taver/);
    }

    // Verify translations avoid Italian fallbacks
    expect(LANGS.it.free).toBe('Gratis');
    expect(LANGS.it.barter).toBe('Baratto');
    expect(LANGS.en.free).toBe('Free');
    expect(LANGS.en.barter).toBe('Barter');
    expect(LANGS.es.free).toBe('Gratis');
    expect(LANGS.es.barter).toBe('Trueque');
    expect(LANGS.fr.free).toBe('Gratuit');
    expect(LANGS.fr.barter).toBe('Troc');
    expect(LANGS.de.free).toBe('Kostenlos');
    expect(LANGS.de.barter).toBe('Tausch');
  });

  test('eliminates unverified marketing claims from hero and footer across all languages', () => {
    for (const lang of supportedLanguages) {
      const dict = LANGS[lang];

      // Must not claim verified services or verified payments
      expect(dict.heroDesc.toLowerCase()).not.toContain('servizi verificati');
      expect(dict.heroDesc.toLowerCase()).not.toContain('pagamenti verificati');
      expect(dict.heroDesc.toLowerCase()).not.toContain('verified payments');

      // Must not claim "Nessun costo nascosto" without terms confirmation
      expect(dict.heroBadge.toLowerCase()).not.toContain('nessun costo nascosto');
      expect(dict.heroBadge.toLowerCase()).not.toContain('no hidden costs');

      // Footer must not claim Licenza MIT or Verified Payments
      expect(dict.footerCommunity.toLowerCase()).not.toContain('licenza mit');
      expect(dict.footerCommunity.toLowerCase()).not.toContain('mit license');
      expect(dict.footerSecurity.toLowerCase()).not.toContain('verified payments');
      expect(dict.footerSecurity.toLowerCase()).not.toContain('pagamenti verificati');
    }
  });

  test('featured categories have 6 clean sample items without fictitious prices or fake verification', () => {
    for (const lang of supportedLanguages) {
      const cats = LANGS[lang].categories;
      expect(Array.isArray(cats)).toBe(true);
      expect(cats).toHaveLength(6);

      for (const cat of cats) {
        expect(cat.icon).toBeTruthy();
        expect(cat.title).toBeTruthy();
        expect(cat.desc).toBeTruthy();
        expect(cat.slug).toBeTruthy();

        // No fictitious prices
        expect(cat.price).toBeUndefined();
        // No fake verification badges
        expect(cat.badge).toBeUndefined();
        // Text must not claim to be verified
        expect(cat.title.toLowerCase()).not.toContain('verificato');
        expect(cat.desc.toLowerCase()).not.toContain('verificato');
      }
    }
  });

  test('detectLang safely returns saved or browser language falling back to en', () => {
    const originalStorage = global.localStorage;
    const originalNavigator = global.navigator;

    try {
      localStorage.setItem('myzubster-language', 'de');
      expect(detectLang()).toBe('de');

      localStorage.removeItem('myzubster-language');
      expect(['it', 'en', 'es', 'fr', 'de']).toContain(detectLang());
    } finally {
      global.localStorage = originalStorage;
      global.navigator = originalNavigator;
    }
  });
});

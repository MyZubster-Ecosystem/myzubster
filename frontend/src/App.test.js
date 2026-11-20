import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App, { LANGS, detectLang, SixEntryPointsGrid, ComicsPage } from './App';
import SocialLoginPage from './pages/SocialLoginPage';

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
      expect(dict.askZorgax).toBeTruthy();
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

  test('declares six distinct homepage CTAs ordered with Marketplace and Zorgax prominent', () => {
    for (const lang of supportedLanguages) {
      const dict = LANGS[lang];
      expect(Array.isArray(dict.sixAreas)).toBe(true);
      expect(dict.sixAreas).toHaveLength(6);

      const [marketplace, zorgax, metaverse, passport, knowledge, comics] = dict.sixAreas;

      // 1. Marketplace
      expect(marketplace.key).toBe('marketplace');
      expect(marketplace.href).toBe('/marketplace');
      expect(marketplace.secondaryHref).toBe('/marketplace?action=new');

      // 2. Zorgax
      expect(zorgax.key).toBe('zorgax');
      expect(zorgax.isZorgax).toBe(true);
      expect(zorgax.href).toBe('/zorgax');

      // 3. Metaverse
      expect(metaverse.key).toBe('metaverse');
      expect(metaverse.href).toBe('/metaverse');

      // 4. GitHub & Contributor Passport (with honest proposed/available disclosure)
      expect(passport.key).toBe('passport');
      expect(passport.href).toBe('/social-login');
      expect(passport.badgeType).toBe('warning');
      expect(passport.badge).toMatch(/PROPOST|PROPOS[EÉ]|PROPUE|VORGESCHLAGEN/i);

      // 5. Knowledge
      expect(knowledge.key).toBe('knowledge');
      expect(knowledge.href).toBe('/conoscenze');

      // 6. Comics
      expect(comics.key).toBe('comics');
      expect(comics.href).toBe('/fumetto');
    }
  });

  test('SixEntryPointsGrid renders all 6 distinct CTAs with valid links and badges', () => {
    const html = ReactDOMServer.renderToString(<SixEntryPointsGrid t={LANGS.it} />);

    expect(html).toContain('Marketplace');
    expect(html).toContain('Zorgax Copilota');
    expect(html).toContain('Metaverso · Neon Plaza');
    expect(html).toContain('GitHub &amp; Contributor Passport');
    expect(html).toContain('Knowledge &amp; Conoscenze');
    expect(html).toContain('Fumetto &amp; Narrazione');

    expect(html).toContain('href="/marketplace"');
    expect(html).toContain('href="/marketplace?action=new"');
    expect(html).toContain('href="/metaverse"');
    expect(html).toContain('href="/social-login"');
    expect(html).toContain('href="/conoscenze"');
    expect(html).toContain('href="/fumetto"');

    expect(html).toContain('LOGIN LIVE · PASSPORT PROPOSTO');
  });

  test('ComicsPage renders interactive viewer, chapter index, and token provenance disclaimer', () => {
    const html = ReactDOMServer.renderToString(<ComicsPage />);

    expect(html).toContain('Fumetto Community &amp; Galleria Live');
    expect(html).toContain('Trasparenza su Token &amp; Opere:');
    expect(html).toContain('title="MyZubster Comic Universe Reader"');
    expect(html).toContain('13 Capitoli dell’Universo Narrativo MyZubster');
    expect(html).toContain('Daniel // MyZubster: Origins');
    expect(html).toContain('href="/fumetto.html"');
    expect(html).toContain('MyZubster-Photos');
  });

  test('SocialLoginPage renders honest Contributor Passport card with proposed status', () => {
    const originalStorage = global.localStorage;
    try {
      localStorage.setItem('myzubster-language', 'it');
      const htmlIt = ReactDOMServer.renderToString(<SocialLoginPage />);
      expect(htmlIt).toContain('Identità GitHub &amp; Percorso Contributor Passport');
      expect(htmlIt).toContain('PROPOSTO / IN SVILUPPO');
      expect(htmlIt).toContain('✓ GitHub OAuth: Disponibile');
      expect(htmlIt).toContain('✓ Google &amp; Accesso Diretto: Preservati');
      expect(htmlIt).toContain('⏳ Contributor Passport: Percorso Opt-In Proposto');

      localStorage.setItem('myzubster-language', 'en');
      const htmlEn = ReactDOMServer.renderToString(<SocialLoginPage />);
      expect(htmlEn).toContain('GitHub Identity &amp; Contributor Passport Path');
      expect(htmlEn).toContain('PROPOSED / UNDER ROADMAP');
      expect(htmlEn).toContain('✓ GitHub OAuth: Available');
    } finally {
      global.localStorage = originalStorage;
    }
  });

  test('App resolves /fumetto route to ComicsPage in client SPA', () => {
    const originalLocation = window.location;
    delete window.location;
    window.location = { pathname: '/fumetto', search: '', hash: '', assign: jest.fn() };

    try {
      const html = ReactDOMServer.renderToString(<App />);
      expect(html).toContain('Fumetto Community &amp; Galleria Live');
      expect(html).toContain('title="MyZubster Comic Universe Reader"');
    } finally {
      window.location = originalLocation;
    }
  });
});

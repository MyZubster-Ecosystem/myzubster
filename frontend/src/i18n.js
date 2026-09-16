export const SUPPORTED_LANGUAGES = ['it','en','es','fr','de'];

const LANGUAGE_META = {
  it: {
    title: 'MyZubster — Open Source, Territorio e Comunità',
    description: 'MyZubster è un ecosistema open source per territorio, ambiente, robotica, identità digitali e contributi verificabili.',
    locale: 'it_IT'
  },
  en: {
    title: 'MyZubster — Open Source, Community and Projects',
    description: 'MyZubster is an open-source ecosystem for community projects, environment, digital identity, research, marketplaces and verifiable contributions.',
    locale: 'en_US'
  },
  es: {
    title: 'MyZubster — Código abierto, comunidad y proyectos',
    description: 'MyZubster es un ecosistema de código abierto para proyectos comunitarios, medio ambiente, identidad digital, investigación y contribuciones verificables.',
    locale: 'es_ES'
  },
  fr: {
    title: 'MyZubster — Open source, communauté et projets',
    description: 'MyZubster est un écosystème open source pour les projets communautaires, l’environnement, l’identité numérique, la recherche et les contributions vérifiables.',
    locale: 'fr_FR'
  },
  de: {
    title: 'MyZubster — Open Source, Community und Projekte',
    description: 'MyZubster ist ein Open-Source-Ökosystem für Community-Projekte, Umwelt, digitale Identität, Forschung und nachvollziehbare Beiträge.',
    locale: 'de_DE'
  }
};

export function applyLanguageMetadata(language) {
  if (typeof document === 'undefined') return;
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';
  const meta = LANGUAGE_META[lang] || LANGUAGE_META.en;
  document.documentElement.lang = lang;
  document.title = meta.title;
  const setMeta = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.setAttribute('content', value);
  };
  setMeta('meta[name="description"]', meta.description);
  setMeta('meta[property="og:title"]', meta.title);
  setMeta('meta[property="og:description"]', meta.description);
  setMeta('meta[property="og:locale"]', meta.locale);
  setMeta('meta[name="twitter:title"]', meta.title);
  setMeta('meta[name="twitter:description"]', meta.description);
}

export function getLanguage() {
  const requested = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('lang')?.slice(0,2).toLowerCase()
    : null;
  let lang;
  if (SUPPORTED_LANGUAGES.includes(requested)) {
    localStorage.setItem('myzubster-language', requested);
    lang = requested;
  } else {
    const saved = localStorage.getItem('myzubster-language');
    if (SUPPORTED_LANGUAGES.includes(saved)) lang = saved;
    else {
      const browser = (navigator.language || 'en').slice(0,2).toLowerCase();
      lang = SUPPORTED_LANGUAGES.includes(browser) ? browser : 'en';
    }
  }
  applyLanguageMetadata(lang);
  return lang;
}

export function setLanguage(language) {
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';
  localStorage.setItem('myzubster-language', lang);
  applyLanguageMetadata(lang);
  return lang;
}

export function pick(dictionary, language = getLanguage()) {
  return dictionary[language] || dictionary.en || dictionary.it;
}

export const LANGUAGE_NAMES = { it:'Italiano', en:'English', es:'Español', fr:'Français', de:'Deutsch' };

export const SUPPORTED_LANGUAGES = ['it','en','es','fr','de'];

export function getLanguage() {
  const saved = localStorage.getItem('myzubster-language');
  if (SUPPORTED_LANGUAGES.includes(saved)) return saved;
  const browser = (navigator.language || 'en').slice(0,2).toLowerCase();
  return SUPPORTED_LANGUAGES.includes(browser) ? browser : 'en';
}

export function setLanguage(language) {
  const lang = SUPPORTED_LANGUAGES.includes(language) ? language : 'en';
  localStorage.setItem('myzubster-language', lang);
  document.documentElement.lang = lang;
  return lang;
}

export function pick(dictionary, language = getLanguage()) {
  return dictionary[language] || dictionary.en || dictionary.it;
}

export const LANGUAGE_NAMES = { it:'Italiano', en:'English', es:'Español', fr:'Français', de:'Deutsch' };

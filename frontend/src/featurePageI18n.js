import { getLanguage, LANGUAGE_NAMES, setLanguage } from './i18n';

const TEXT = {
  en: {
    'Entra nel mondo':'Enter the world','personaggio creato':'character created','personaggi creati':'characters created','Il tuo nome pubblico':'Your public name','Come vuoi farti chiamare?':'What should we call you?','Ingresso…':'Entering…','Entra con il tuo account':'Enter with your account','Entra come ospite':'Enter as guest','Cambia personaggio':'Change character','VERIFICATO':'VERIFIED','ESPLORATORI VERIFICATI':'VERIFIED EXPLORERS','Accedi per usare un personaggio verificato.':'Sign in to use a verified character.','Sessione autenticata':'Authenticated session','Demo guidata':'Guided demo','Le azioni usano le API pilot reali.':'Actions use the real pilot APIs.','Nessun dato viene scritto nel backend.':'No data is written to the backend.','Accedi per modalità live':'Sign in for live mode','Percorso pilot':'Pilot journey','Onboarding':'Onboarding','Idee':'Ideas','Scelta':'Selection','Validazione':'Validation','Lancio':'Launch','Misurazione':'Measurement','Operazione completata. Nessuna pubblicazione o spesa automatica eseguita.':'Operation completed. No automatic publishing or spending was performed.',
    'Prova subito Neon Plaza senza registrazione: crea un personaggio ospite, incontra Zorgax e completa la prima missione.':'Try Neon Plaza now without registering: create a guest character, meet Zorgax and complete your first mission.','🪐 Entra nella Neon Plaza — prova senza registrarti':'🪐 Enter Neon Plaza — try it without signing up','🚀 Crea il profilo e salva i progressi':'🚀 Create a profile and save your progress','🌱 Proponi un pilot':'🌱 Propose a pilot','✉️ Contatta MyZubster':'✉️ Contact MyZubster','Nessun wallet, visore VR o installazione richiesti.':'No wallet, VR headset or installation required.','📖 La nuova storia MyZubster':'📖 The new MyZubster story','Leggi il fumetto completo →':'Read the full comic →','MYZUBSTER · SCEGLI IL TUO PERCORSO':'MYZUBSTER · CHOOSE YOUR PATH','Da dove vuoi iniziare?':'Where do you want to start?','Puoi parlare con Zorgax, entrare nel Metaverso oppure esplorare il sito e i progetti. Scegli una direzione: non serve conoscere tutto in anticipo.':'Talk to Zorgax, enter the Metaverse, or explore the site and projects. Choose a direction — you do not need to understand everything in advance.','Parla con il copilota e trova il percorso giusto.':'Talk to the copilot and find the right path.','Entra nella Neon Plaza e crea il tuo personaggio.':'Enter Neon Plaza and create your character.','🌍 Sito e progetti':'🌍 Site and projects','Esplora orti, repository, fumetto e community.':'Explore gardens, repositories, comics and the community.','Scopri pilot ambientali, attività e opportunità concrete.':'Discover environmental pilots, activities and concrete opportunities.','Apri →':'Open →','Darkode · storia':'Darkode · story','Inizia con un piccolo contributo, prova un’utilità concreta':'Start with a small contribution and try a concrete utility'
  },
  es: {
    'Entra nel mondo':'Entra en el mundo','personaggio creato':'personaje creado','personaggi creati':'personajes creados','Il tuo nome pubblico':'Tu nombre público','Come vuoi farti chiamare?':'¿Cómo quieres que te llamemos?','Ingresso…':'Entrando…','Entra con il tuo account':'Entra con tu cuenta','Entra come ospite':'Entra como invitado','Cambia personaggio':'Cambiar personaje','VERIFICATO':'VERIFICADO','ESPLORATORI VERIFICATI':'EXPLORADORES VERIFICADOS','Accedi per modalità live':'Inicia sesión para el modo live','Onboarding':'Inicio','Idee':'Ideas','Scelta':'Selección','Validazione':'Validación','Lancio':'Lanzamiento','Misurazione':'Medición','Da dove vuoi iniziare?':'¿Por dónde quieres empezar?','Apri →':'Abrir →','🌍 Sito e progetti':'🌍 Sitio y proyectos','✉️ Contatta MyZubster':'✉️ Contactar MyZubster','🌱 Proponi un pilot':'🌱 Proponer un piloto','Leggi il fumetto completo →':'Leer el cómic completo →'
  },
  fr: {
    'Entra nel mondo':'Entrer dans le monde','personaggio creato':'personnage créé','personaggi creati':'personnages créés','Il tuo nome pubblico':'Votre nom public','Come vuoi farti chiamare?':'Comment souhaitez-vous être appelé ?','Ingresso…':'Entrée…','Entra con il tuo account':'Entrer avec votre compte','Entra come ospite':'Entrer comme invité','Cambia personaggio':'Changer de personnage','VERIFICATO':'VÉRIFIÉ','ESPLORATORI VERIFICATI':'EXPLORATEURS VÉRIFIÉS','Accedi per modalità live':'Connectez-vous pour le mode live','Idee':'Idées','Scelta':'Sélection','Validazione':'Validation','Lancio':'Lancement','Misurazione':'Mesure','Da dove vuoi iniziare?':'Par où voulez-vous commencer ?','Apri →':'Ouvrir →','🌍 Sito e progetti':'🌍 Site et projets','✉️ Contatta MyZubster':'✉️ Contacter MyZubster','🌱 Proponi un pilot':'🌱 Proposer un pilote','Leggi il fumetto completo →':'Lire la BD complète →'
  },
  de: {
    'Entra nel mondo':'Welt betreten','personaggio creato':'Charakter erstellt','personaggi creati':'Charaktere erstellt','Il tuo nome pubblico':'Dein öffentlicher Name','Come vuoi farti chiamare?':'Wie möchtest du genannt werden?','Ingresso…':'Betreten…','Entra con il tuo account':'Mit deinem Konto betreten','Entra come ospite':'Als Gast betreten','Cambia personaggio':'Charakter wechseln','VERIFICATO':'VERIFIZIERT','ESPLORATORI VERIFICATI':'VERIFIZIERTE ENTDECKER','Accedi per modalità live':'Für Live-Modus anmelden','Idee':'Ideen','Scelta':'Auswahl','Validazione':'Validierung','Lancio':'Start','Misurazione':'Messung','Da dove vuoi iniziare?':'Wo möchtest du anfangen?','Apri →':'Öffnen →','🌍 Sito e progetti':'🌍 Website und Projekte','✉️ Contatta MyZubster':'✉️ MyZubster kontaktieren','🌱 Proponi un pilot':'🌱 Pilotprojekt vorschlagen','Leggi il fumetto completo →':'Vollständigen Comic lesen →'
  }
};

const FRONTEND_PATHS = ['/', '/marketplace', '/metaverse', '/life-pilot', '/zorgax/life-pilot', '/social-login', '/social-login.html', '/apps'];

function translateNode(root, dictionary) {
  if (!root || !dictionary) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const raw = node.nodeValue;
    const trimmed = raw.trim();
    if (dictionary[trimmed]) node.nodeValue = raw.replace(trimmed, dictionary[trimmed]);
  });
  root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(el => {
    ['placeholder','aria-label','title'].forEach(attr => {
      const value = el.getAttribute(attr);
      if (value && dictionary[value]) el.setAttribute(attr, dictionary[value]);
    });
  });
}

function addLanguageSwitcher(lang) {
  if (window.location.pathname === '/' || document.getElementById('myz-global-language')) return;
  const wrap = document.createElement('div');
  wrap.id = 'myz-global-language';
  wrap.style.cssText = 'position:fixed;top:10px;right:10px;z-index:10000;background:#0f172acc;border:1px solid #64748b;border-radius:10px;padding:6px;backdrop-filter:blur(8px)';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Language');
  select.style.cssText = 'background:#0f172a;color:#fff;border:1px solid #64748b;border-radius:7px;padding:7px;font-weight:700';
  Object.entries(LANGUAGE_NAMES).forEach(([code, name]) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = name;
    option.selected = code === lang;
    select.appendChild(option);
  });
  select.addEventListener('change', event => {
    setLanguage(event.target.value);
    window.location.reload();
  });
  wrap.appendChild(select);
  document.body.appendChild(wrap);
}

export function startFeaturePageI18n() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (!FRONTEND_PATHS.includes(path) && !path.startsWith('/metaverse/rooms/')) return;
  const lang = getLanguage();
  document.documentElement.lang = lang;
  const dictionary = lang === 'it' ? null : (TEXT[lang] || TEXT.en);
  const apply = () => { if (dictionary) translateNode(document.getElementById('root'), dictionary); };
  const observer = new MutationObserver(apply);
  const boot = () => {
    apply();
    addLanguageSwitcher(lang);
    const root = document.getElementById('root');
    if (root) observer.observe(root, { childList:true, subtree:true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else queueMicrotask(boot);
}

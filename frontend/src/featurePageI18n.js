import { getLanguage } from './i18n';

const TEXT = {
  en: {
    'Entra nel mondo':'Enter the world','personaggio creato':'character created','personaggi creati':'characters created','Il tuo nome pubblico':'Your public name','Come vuoi farti chiamare?':'What should we call you?','Ingresso…':'Entering…','Entra con il tuo account':'Enter with your account','Entra come ospite':'Enter as guest','Cambia personaggio':'Change character','VERIFICATO':'VERIFIED','ESPLORATORI VERIFICATI':'VERIFIED EXPLORERS','Accedi per usare un personaggio verificato.':'Sign in to use a verified character.','Sessione autenticata':'Authenticated session','Demo guidata':'Guided demo','Le azioni usano le API pilot reali.':'Actions use the real pilot APIs.','Nessun dato viene scritto nel backend.':'No data is written to the backend.','Accedi per modalità live':'Sign in for live mode','Percorso pilot':'Pilot journey','Onboarding':'Onboarding','Idee':'Ideas','Scelta':'Selection','Validazione':'Validation','Lancio':'Launch','Misurazione':'Measurement','Operazione completata. Nessuna pubblicazione o spesa automatica eseguita.':'Operation completed. No automatic publishing or spending was performed.'
  },
  es: {
    'Entra nel mondo':'Entra en el mundo','personaggio creato':'personaje creado','personaggi creati':'personajes creados','Il tuo nome pubblico':'Tu nombre público','Come vuoi farti chiamare?':'¿Cómo quieres que te llamemos?','Ingresso…':'Entrando…','Entra con il tuo account':'Entra con tu cuenta','Entra come ospite':'Entra como invitado','Cambia personaggio':'Cambiar personaje','VERIFICATO':'VERIFICADO','ESPLORATORI VERIFICATI':'EXPLORADORES VERIFICADOS','Accedi per modalità live':'Inicia sesión para el modo live','Onboarding':'Inicio','Idee':'Ideas','Scelta':'Selección','Validazione':'Validación','Lancio':'Lanzamiento','Misurazione':'Medición'
  },
  fr: {
    'Entra nel mondo':'Entrer dans le monde','personaggio creato':'personnage créé','personaggi creati':'personnages créés','Il tuo nome pubblico':'Votre nom public','Come vuoi farti chiamare?':'Comment souhaitez-vous être appelé ?','Ingresso…':'Entrée…','Entra con il tuo account':'Entrer avec votre compte','Entra come ospite':'Entrer comme invité','Cambia personaggio':'Changer de personnage','VERIFICATO':'VÉRIFIÉ','ESPLORATORI VERIFICATI':'EXPLORATEURS VÉRIFIÉS','Accedi per modalità live':'Connectez-vous pour le mode live','Idee':'Idées','Scelta':'Sélection','Validazione':'Validation','Lancio':'Lancement','Misurazione':'Mesure'
  },
  de: {
    'Entra nel mondo':'Welt betreten','personaggio creato':'Charakter erstellt','personaggi creati':'Charaktere erstellt','Il tuo nome pubblico':'Dein öffentlicher Name','Come vuoi farti chiamare?':'Wie möchtest du genannt werden?','Ingresso…':'Betreten…','Entra con il tuo account':'Mit deinem Konto betreten','Entra come ospite':'Als Gast betreten','Cambia personaggio':'Charakter wechseln','VERIFICATO':'VERIFIZIERT','ESPLORATORI VERIFICATI':'VERIFIZIERTE ENTDECKER','Accedi per modalità live':'Für Live-Modus anmelden','Idee':'Ideen','Scelta':'Auswahl','Validazione':'Validierung','Lancio':'Start','Misurazione':'Messung'
  }
};

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

export function startFeaturePageI18n() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const lang = getLanguage();
  document.documentElement.lang = lang;
  if (lang === 'it') return;
  const dictionary = TEXT[lang] || TEXT.en;
  const apply = () => {
    if (!['/metaverse','/life-pilot'].includes(window.location.pathname)) return;
    translateNode(document.getElementById('root'), dictionary);
  };
  const observer = new MutationObserver(apply);
  const boot = () => {
    apply();
    const root = document.getElementById('root');
    if (root) observer.observe(root, { childList:true, subtree:true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else queueMicrotask(boot);
}

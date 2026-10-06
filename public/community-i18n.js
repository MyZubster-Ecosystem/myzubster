(() => {
  const SUPPORTED = ['it','en','es','fr','de'];
  const NAMES = {it:'Italiano',en:'English',es:'Español',fr:'Français',de:'Deutsch'};
  const META = {
    it:{title:'MyZubster Community Map & Marketplace',description:'Marketplace MyZubster per prodotti, elettronica, orti, scambio semi, donatori di kefir e comunità pet.'},
    en:{title:'MyZubster Community Map & Marketplace',description:'MyZubster community marketplace for products, electronics, gardens, seed exchange, kefir donors, services, research and pets.'},
    es:{title:'MyZubster Community Map & Marketplace',description:'Marketplace comunitario MyZubster para productos, electrónica, huertos, semillas, servicios, investigación y mascotas.'},
    fr:{title:'MyZubster Community Map & Marketplace',description:'Marketplace communautaire MyZubster pour produits, électronique, jardins, semences, services, recherche et animaux.'},
    de:{title:'MyZubster Community Map & Marketplace',description:'MyZubster Community-Marktplatz für Produkte, Elektronik, Gärten, Saatgut, Dienstleistungen, Forschung und Haustiere.'}
  };
  const D = {
    en:{
      'Fumetto':'Comic','Mutuo aiuto':'Mutual aid','Università':'University','Mappa orti':'Garden map','Account':'Account',
      'COMPETENZE · BISOGNI · SCAMBI · PROGETTI · COMUNITÀ':'SKILLS · NEEDS · EXCHANGES · PROJECTS · COMMUNITY',
      'Quello che sai fare diventa una risorsa per qualcun altro.':'What you can do becomes a resource for someone else.',
      'RETE DI MUTUO AIUTO':'MUTUAL AID NETWORK','Una comunità che si sostiene':'A community that supports itself',
      '💻 Sviluppatori':'💻 Developers','🔊 Raver e culture underground':'🔊 Ravers and underground cultures','🌾 Agricoltori':'🌾 Farmers','🥛 Kefir e fermentazione':'🥛 Kefir and fermentation','🎨 Arte':'🎨 Art','🌿 Benessere':'🌿 Wellbeing',
      'Crea il tuo profilo':'Create your profile','Offri o chiedi aiuto':'Offer or ask for help','Chiedi a Zorgax':'Ask Zorgax',
      'UNIVERSITÀ · FORMAZIONE · RICERCA · GITHUB':'UNIVERSITY · TRAINING · RESEARCH · GITHUB','Dallo studio a un progetto pubblico e verificabile':'From study to a public, verifiable project','🎓 Studenti':'🎓 Students','🏛️ Docenti e tutor':'🏛️ Teachers and tutors','🔬 Ricercatori':'🔬 Researchers','Crea profilo accademico':'Create academic profile','Pubblica corso o ricerca':'Publish a course or research project','Trova un progetto con Zorgax':'Find a project with Zorgax','Apri GitHub':'Open GitHub',
      'MAPPA VERDE':'GREEN MAP','Orti, giardini botanici, comunali e seed bank':'Community gardens, botanical gardens, municipal gardens and seed banks','Tutte le categorie':'All categories','📍 Vicino a me':'📍 Near me',
      'Registrazione / login':'Sign up / login','Registrati':'Sign up','IDENTITÀ PUBBLICA OPZIONALE':'OPTIONAL PUBLIC IDENTITY','PGP + wallet':'PGP + wallet','Salva profilo':'Save profile',
      'PUBBLICA':'PUBLISH','Nuovo annuncio':'New listing','Titolo':'Title','Pubblica annuncio':'Publish listing','Tutto':'All','Sanitari':'Health','Elettronica':'Electronics','Semi':'Seeds','Piante':'Plants','Pet':'Pets','Servizi':'Services','Aiuto':'Help','Eventi':'Events','Ricerca':'Research','Corsi':'Courses','Privacy e scambi responsabili':'Privacy and responsible exchanges',
      '✨ Compila con Zorgax':'✨ Fill with Zorgax','✨ Zorgax · Assistente annuncio':'✨ Zorgax · Listing assistant','Categoria':'Category','Cosa vuoi offrire, vendere, regalare o cercare?':'What do you want to offer, sell, give away or look for?','Dettagli utili':'Useful details','Località pubblica / area':'Public location / area','Modalità':'Exchange mode','Baratto':'Barter','Gratis / regalo':'Free / gift','Prezzo':'Price','Precompila annuncio':'Fill listing draft','Chiudi':'Close','Zorgax suggerisce:':'Zorgax suggests:','Es. noleggio sound system per eventi':'E.g. sound system rental for events','Condizioni, quantità, disponibilità, requisiti…':'Conditions, quantity, availability, requirements…','Es. Bologna e provincia':'E.g. Bologna and surrounding area'
    },
    es:{'Fumetto':'Cómic','Mutuo aiuto':'Ayuda mutua','Università':'Universidad','Mappa orti':'Mapa de huertos','Quello che sai fare diventa una risorsa per qualcun altro.':'Lo que sabes hacer se convierte en un recurso para otra persona.','Una comunità che si sostiene':'Una comunidad que se apoya','Crea il tuo profilo':'Crea tu perfil','Offri o chiedi aiuto':'Ofrece o pide ayuda','Nuovo annuncio':'Nuevo anuncio','Pubblica annuncio':'Publicar anuncio','Privacy e scambi responsabili':'Privacidad e intercambios responsables','✨ Compila con Zorgax':'✨ Completar con Zorgax','Categoria':'Categoría','Prezzo':'Precio','Chiudi':'Cerrar'},
    fr:{'Fumetto':'BD','Mutuo aiuto':'Entraide','Università':'Université','Mappa orti':'Carte des jardins','Quello che sai fare diventa una risorsa per qualcun altro.':'Ce que vous savez faire devient une ressource pour quelqu’un d’autre.','Una comunità che si sostiene':'Une communauté qui s’entraide','Crea il tuo profilo':'Créer votre profil','Offri o chiedi aiuto':'Proposer ou demander de l’aide','Nuovo annuncio':'Nouvelle annonce','Pubblica annuncio':'Publier l’annonce','Privacy e scambi responsabili':'Confidentialité et échanges responsables','✨ Compila con Zorgax':'✨ Remplir avec Zorgax','Categoria':'Catégorie','Prezzo':'Prix','Chiudi':'Fermer'},
    de:{'Fumetto':'Comic','Mutuo aiuto':'Gegenseitige Hilfe','Università':'Universität','Mappa orti':'Gartenkarte','Quello che sai fare diventa una risorsa per qualcun altro.':'Was du kannst, wird zur Ressource für jemand anderen.','Una comunità che si sostiene':'Eine Gemeinschaft, die sich gegenseitig unterstützt','Crea il tuo profilo':'Profil erstellen','Offri o chiedi aiuto':'Hilfe anbieten oder anfragen','Nuovo annuncio':'Neue Anzeige','Pubblica annuncio':'Anzeige veröffentlichen','Privacy e scambi responsabili':'Datenschutz und verantwortungsvoller Austausch','✨ Compila con Zorgax':'✨ Mit Zorgax ausfüllen','Categoria':'Kategorie','Prezzo':'Preis','Chiudi':'Schließen'}
  };

  const requested = new URLSearchParams(location.search).get('lang')?.slice(0,2).toLowerCase();
  if (SUPPORTED.includes(requested)) localStorage.setItem('myzubster-language', requested);
  const saved = localStorage.getItem('myzubster-language');
  const browser = (navigator.language || 'en').slice(0,2).toLowerCase();
  const lang = SUPPORTED.includes(requested) ? requested : (SUPPORTED.includes(saved) ? saved : (SUPPORTED.includes(browser) ? browser : 'en'));
  document.documentElement.lang = lang;
  const meta = META[lang] || META.en;
  document.title = meta.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute('content', meta.description);

  function translate(root, dict) {
    if (!dict || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[]; while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{const raw=node.nodeValue, key=raw.trim(); if(dict[key]) node.nodeValue=raw.replace(key,dict[key]);});
    root.querySelectorAll('[placeholder],[title],[aria-label]').forEach(el=>['placeholder','title','aria-label'].forEach(attr=>{const v=el.getAttribute(attr); if(v&&dict[v]) el.setAttribute(attr,dict[v]);}));
  }

  function addSwitcher(){
    if(document.getElementById('myz-community-language')) return;
    const wrap=document.createElement('div'); wrap.id='myz-community-language'; wrap.style.cssText='position:fixed;right:10px;bottom:10px;z-index:12000;background:#071018e8;border:1px solid #365064;border-radius:10px;padding:6px';
    const select=document.createElement('select'); select.setAttribute('aria-label','Language'); select.style.cssText='width:auto;min-width:120px;padding:7px;background:#08131d;color:#fff;border:1px solid #365064;border-radius:7px';
    Object.entries(NAMES).forEach(([code,name])=>{const o=document.createElement('option');o.value=code;o.textContent=name;o.selected=code===lang;select.appendChild(o);});
    select.addEventListener('change',e=>{localStorage.setItem('myzubster-language',e.target.value);const url=new URL(location.href);url.searchParams.set('lang',e.target.value);location.href=url.toString();}); wrap.appendChild(select); document.body.appendChild(wrap);
  }

  const dict=lang==='it'?null:(D[lang]||D.en);
  const apply=()=>translate(document.body,dict);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{apply();addSwitcher();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});},{once:true});
  else {apply();addSwitcher();new MutationObserver(apply).observe(document.body,{childList:true,subtree:true});}
})();

import React,{useCallback,useEffect,useMemo,useRef,useState}from'react';
import WalletHubPanel from'../components/WalletHubPanel';
import{trackConversion,trackConversionOnce}from'../analytics/conversionAnalytics';
import{getLanguage,LANGUAGE_NAMES,setLanguage}from'../i18n';

const categories=['health_products','electronics','kefir_culture_donation','seeds','plants','produce','clothing','accessories','event_equipment','tools','services','development_services','digital_services','event_support','agriculture_support','art','wellness','knowledge','help_request','university_course','thesis_project','research_project','internship','volunteering','pet_adoption','pet_lost_found','pet_services'];
const demoCategories=[...categories];
const currencies=['FREE','BARTER','EUR','MYZ','ETH','BTC','XMR','TARI'];
const DEMO_SELLERS=[
  {"id": "demo-health", "icon": "🌿", "name": "Wellness Products Demo", "category": "health_products", "location": "Italia", "offer": "Prodotti per il benessere quotidiano", "description": "Esempio di prodotti non medici con ingredienti e modalità di utilizzo dichiarati.", "price": "20 EUR", "requests": 0, "availability": "Da concordare", "details": [["Prodotto", "Benessere non medico"], ["Modalità", "Solo dimostrativa"]]},
  {"id": "demo-electronics", "icon": "🔌", "name": "Electronics Repair Parts Demo", "category": "electronics", "location": "Italia", "offer": "Componenti elettronici riutilizzabili", "description": "Esempio di componenti recuperati con stato e compatibilità dichiarati.", "price": "10 EUR", "requests": 0, "availability": "Da concordare", "details": [["Stato", "Recuperato e verificato"], ["Modalità", "Solo dimostrativa"]]},
  {"id": "demo-kefir-culture", "icon": "🥛", "name": "Kefir Culture Donation Demo", "category": "kefir_culture_donation", "location": "Italia", "offer": "Dono di grani di kefir d’acqua", "description": "Dono gratuito dimostrativo con istruzioni di conservazione e limiti di sicurezza.", "price": "FREE", "requests": 0, "availability": "Da concordare", "details": [["Tipo", "Kefir d’acqua"], ["Modalità", "Solo dimostrativa"]]},
  {"id": "demo-development", "icon": "🧑‍💻", "name": "Open Source Development Demo", "category": "development_services", "location": "Italia", "offer": "Revisione di una pull request", "description": "Servizio dimostrativo di revisione tecnica con repository e obiettivi concordati.", "price": "30 EUR", "requests": 0, "availability": "Da concordare", "details": [["Output", "Commenti di revisione"], ["Modalità", "Solo dimostrativa"]]},
  {"id": "demo-digital-services", "icon": "💻", "name": "Digital Services & Skills Demo", "category": "digital_services", "location": "Italia / Remoto", "offer": "Consulenza tecnica, script e sviluppo software", "description": "Esempio dimostrativo di competenze digitali e servizi software con ambito concordato.", "price": "40 EUR", "requests": 0, "availability": "Remoto", "details": [["Competenza", "Sviluppo web e automazione"], ["Modalità", "Solo dimostrativa"]]},
  {"id": "demo-event-support", "icon": "🎛️", "name": "Event Support Demo", "category": "event_support", "location": "Italia", "offer": "Supporto audio per un evento", "description": "Esempio di assistenza tecnica con disponibilità e dotazione dichiarate.", "price": "50 EUR", "requests": 0, "availability": "Da concordare", "details": [["Attività", "Supporto tecnico audio"], ["Modalità", "Solo dimostrativa"]]},
  {"id": "demo-agriculture", "icon": "🌱", "name": "Community Garden Support Demo", "category": "agriculture_support", "location": "Italia", "offer": "Supporto per un orto condiviso", "description": "Esempio di collaborazione locale per semina e manutenzione di un orto.", "price": "BARTER", "requests": 0, "availability": "Da concordare", "details": [["Attività", "Semina e manutenzione"], ["Modalità", "Solo dimostrativa"]]},
  {"id": "demo-knowledge", "icon": "📚", "name": "Knowledge Contribution Demo", "category": "knowledge", "location": "Italia", "offer": "Guida con fonti e metodo dichiarati", "description": "Contributo dimostrativo documentato; la presenza di una fonte non certifica competenze o risultati.", "price": "FREE", "requests": 0, "availability": "Da concordare", "details": [["Provenienza", "Fonti dichiarate"], ["Modalità", "Solo dimostrativa"]]},
  {"id": "demo-help-request", "icon": "🤝", "name": "Community Help Request Demo", "category": "help_request", "location": "Italia", "offer": "Cerco aiuto per organizzare uno scambio", "description": "Richiesta dimostrativa di aiuto comunitario con obiettivo e disponibilità pubblici.", "price": "FREE", "requests": 0, "availability": "Da concordare", "details": [["Richiesta", "Organizzazione di uno scambio"], ["Modalità", "Solo dimostrativa"]]},
  {id:'demo-kefir',icon:'🥛',name:'Kefir Lab Demo',category:'produce',location:'Emilia-Romagna',offer:'Grani di kefir e guida introduttiva',description:'Esempio di scambio locale con istruzioni di conservazione e ritiro concordato.',price:'BARTER',requests:4,availability:'Su appuntamento',details:[['Tipo','Scambio alimentare'],['Consegna','Ritiro locale']]},
  {id:'demo-repair',icon:'🧰',name:'Circular Repair Demo',category:'services',location:'Cesena',offer:'Riparazione collaborativa di piccoli oggetti',description:'Sessione dimostrativa di diagnosi e riparazione con approccio circolare.',price:'15 MYZ',requests:7,availability:'Sabato',details:[['Durata','60 minuti'],['Modalità','In presenza']]},
  {id:'demo-seeds',icon:'🌾',name:'Seed Commons Demo',category:'seeds',location:'Italia',offer:'Scambio di semi locali tracciabili',description:'Lotto dimostrativo con provenienza e stagione consigliata.',price:'FREE',requests:3,availability:'Primavera',details:[['Provenienza','Locale'],['Scambio','Community']]},
  {id:'demo-sound-system',icon:'🔊',name:'Sound System Collective Demo',category:'tools',location:'Italia',offer:'Vendita o noleggio di un sound system artigianale completo',description:'Configurazione dimostrativa per eventi autorizzati, con trasporto da concordare.',price:'1.200 EUR',requests:9,availability:'Weekend',details:[['Potenza','Demo 6 kW'],['Uso','Eventi autorizzati']]},
  {id:'demo-audio-gear',icon:'🎚️',name:'Underground Audio Gear Demo',category:'tools',location:'Bologna',offer:'Mixer, amplificatori, cavi e componenti audio usati',description:'Set dimostrativo di attrezzatura usata verificabile prima dello scambio.',price:'BARTER',requests:6,availability:'Disponibile',details:[['Condizione','Usato'],['Scambio','Baratto']]},
  {id:'demo-event-tech',icon:'💡',name:'Free Party Tech Demo',category:'services',location:'Europa',offer:'Montaggio audio, luci e assistenza tecnica per eventi culturali',description:'Servizio demo per eventi legali e autorizzati, dalla preparazione al disallestimento.',price:'180 EUR',requests:5,availability:'Su calendario',details:[['Servizio','Audio + luci'],['Sicurezza','Evento autorizzato']]},
  {id:'demo-subculture-wear',icon:'🧥',name:'Subculture Wear Demo',category:'clothing',location:'Europa',offer:'Indumenti, patch, borse e accessori legati alle culture underground',description:'Capsule demo di abbigliamento recuperato e personalizzato.',price:'35 EUR',requests:8,availability:'Disponibile',details:[['Produzione','Upcycling'],['Taglia','Variabile']]},
  {id:'demo-event-sound-rental',icon:'🎛️',name:'Mobile Sound Rental Demo',category:'event_equipment',location:'Italia',offer:'Noleggio impianto audio completo per eventi con trasporto e montaggio',description:'Pacchetto dimostrativo con consegna, setup e ritiro.',price:'350 EUR',requests:11,availability:'Weekend',details:[['Include','Trasporto + setup'],['Uso','Eventi autorizzati']]},
  {id:'demo-dj-package',icon:'🎧',name:'DJ & Crew Demo',category:'services',location:'Italia',offer:'DJ set, selezione musicale e supporto tecnico per eventi',description:'Crew dimostrativa per programmazione musicale e supporto tecnico.',price:'220 EUR',requests:7,availability:'Su calendario',details:[['Durata','4 ore demo'],['Formato','DJ + supporto']]},
  {id:'demo-event-machines',icon:'🌫️',name:'Event Machines Demo',category:'event_equipment',location:'Emilia-Romagna',offer:'Noleggio luci, macchina del fumo, proiettori, generatori e attrezzature per eventi',description:'Catalogo dimostrativo di attrezzature per produzioni autorizzate.',price:'BARTER',requests:6,availability:'Disponibile',details:[['Inventario','Luci + effetti'],['Scambio','Baratto']]},
  {id:'demo-plants',icon:'🪴',name:'Community Plant Nursery Demo',category:'plants',location:'Italia',offer:'Piante locali con scheda di cura e provenienza documentata',description:'Pianta dimostrativa accompagnata da indicazioni di cura e provenienza.',price:'FREE',requests:3,availability:'Disponibile',details:[['Specie','Pianta locale demo'],['Cura','Scheda inclusa']]},
  {id:'demo-accessories',icon:'🎒',name:'Upcycled Accessories Demo',category:'accessories',location:'Europa',offer:'Borse, patch e accessori realizzati con materiali recuperati',description:'Accessori demo realizzati da materiali riutilizzati.',price:'20 MYZ',requests:5,availability:'Disponibile',details:[['Materiale','Recuperato'],['Produzione','Artigianale']]},
  {id:'demo-volunteering',icon:'🤝',name:'Community Garden Volunteers Demo',category:'volunteering',location:'Emilia-Romagna',offer:'Supporto volontario per cura degli orti e documentazione delle attività',description:'Turno demo di volontariato: nessun pagamento, solo disponibilità e coordinamento.',price:'FREE',requests:4,availability:'Sabato mattina',details:[['Impegno','2 ore'],['Attività','Cura orto e documentazione'],['Compenso','Nessuno · volontariato']]},
  {id:'demo-pet-adoption',icon:'🐶',name:'Responsible Pet Adoption Demo',category:'pet_adoption',location:'Italia',offer:'Profilo dimostrativo per adozione responsabile tramite associazione verificata',description:'Esempio di scheda adozione con contatto mediato da associazione. Nessun acquisto di animali.',price:'FREE',requests:6,availability:'Colloquio richiesto',details:[['Animale','Cane adulto demo'],['Età','4 anni'],['Referente','Associazione demo'],['Procedura','Colloquio + verifica adozione']]},
  {id:'demo-pet-lost-found',icon:'🔎',name:'Lost & Found Pet Alert Demo',category:'pet_lost_found',location:'Italia',offer:'Segnalazione dimostrativa con zona approssimativa e contatto autorizzato',description:'Segnalazione demo progettata per proteggere dati sensibili e posizione esatta.',price:'FREE',requests:2,availability:'Segnalazione aperta',details:[['Stato','Trovato'],['Area','Zona approssimativa'],['Privacy','Posizione esatta non pubblicata']]},
  {id:'demo-pet-services',icon:'🐾',name:'Local Pet Care Demo',category:'pet_services',location:'Cesena',offer:'Passeggiate e assistenza quotidiana per animali domestici',description:'Servizio demo di pet care con disponibilità e area di copertura.',price:'12 EUR',requests:5,availability:'Lun–Ven',details:[['Servizio','Passeggiata 45 min'],['Copertura','Cesena'],['Animali','Cani e gatti']]},
  {id:'demo-preserves',icon:'🍅',name:'Dispensa Locale Demo',category:'produce',location:'Emilia-Romagna',offer:'Conserve, sughi e marmellate fatti in casa',description:'Esempio di produzione locale in piccoli lotti con ingredienti e modalità di ritiro dichiarati.',price:'BARTER',requests:5,availability:'Disponibile',details:[['Prodotti','Sugo, conserve e marmellate'],['Ritiro','Locale']]},
  {id:'demo-plumber',icon:'🔧',name:'Cerco Idraulico Demo',category:'services',location:'Cesena',offer:'Cerco idraulico per perdita sotto il lavello',description:'Richiesta demo per una perdita visibile dal sifone sotto il lavello, con intervento da concordare.',price:'45 EUR',requests:8,availability:'Appena possibile',details:[['Problema','Perdita sotto lavello'],['Intervento','Diagnosi e riparazione']]},
  {id:'demo-pc-repair',icon:'💻',name:'Cerco Tecnico PC Demo',category:'services',location:'Ravenna',offer:'Cerco tecnico per computer guasto',description:'Richiesta demo per diagnosticare un computer che non funziona correttamente e valutare la riparazione.',price:'35 EUR',requests:6,availability:'Questa settimana',details:[['Dispositivo','Computer portatile'],['Richiesta','Diagnosi + riparazione']]},
  {id:'demo-network-tech',icon:'📡',name:'Cerco Sistemista Demo',category:'services',location:'Bologna',offer:'Cerco tecnico di rete per modem e Wi-Fi senza connessione',description:'Richiesta demo per verificare modem, router e rete domestica quando Internet non è disponibile.',price:'50 EUR',requests:7,availability:'Su appuntamento',details:[['Problema','Connessione assente'],['Rete','Modem + router + Wi-Fi']]},
  {id:'demo-mason',icon:'🧱',name:'Cerco Muratore Demo',category:'services',location:'Emilia-Romagna',offer:'Cerco muratore per muro e intonaco danneggiato',description:'Richiesta demo per ripristinare una zona di intonaco deteriorata e rifinire la parete.',price:'120 EUR',requests:4,availability:'Da concordare',details:[['Lavoro','Ripristino intonaco'],['Area','Parete interna']]},
  {id:'demo-electrician',icon:'⚡',name:'Cerco Elettricista Demo',category:'services',location:'Cesena',offer:'Cerco elettricista per presa elettrica guasta',description:'Richiesta demo per controllare una presa non funzionante e mettere in sicurezza il collegamento.',price:'60 EUR',requests:5,availability:'Questa settimana',details:[['Problema','Presa guasta'],['Intervento','Controllo e ripristino']]},
  {id:'demo-art-original',icon:'🎨',name:'Arte & Artisti Demo',category:'art',location:'Italia',offer:'Dipinto originale in vendita',description:'Annuncio demo di un artista indipendente che propone un dipinto originale e il contatto diretto con chi è interessato.',price:'180 EUR',requests:6,availability:'Disponibile',details:[['Opera','Dipinto originale'],['Autore','Artista indipendente']]},
  {id:'demo-wellness-braids',icon:'💇',name:'Treccine & Rasta Demo',category:'wellness',location:'Emilia-Romagna',offer:'Rasta, treccine e acconciature a domicilio',description:'Servizio demo di cura personale non medica con appuntamento a domicilio.',price:'45 EUR',requests:9,availability:'Su appuntamento',details:[['Servizio','Treccine e acconciature'],['Modalità','A domicilio']]},
  {id:'demo-wellness-nails',icon:'💅',name:'Nail Art Demo',category:'wellness',location:'Cesena',offer:'Nail art e manicure a domicilio',description:'Servizio demo di manicure e decorazione unghie con appuntamento concordato.',price:'30 EUR',requests:8,availability:'Lun–Sab',details:[['Servizio','Manicure + nail art'],['Modalità','A domicilio']]},
  {id:'demo-university-course',icon:'🎓',name:'Corso Open Source Demo',category:'university_course',location:'Online / Italia',offer:'Laboratorio introduttivo GitHub e collaborazione open source',description:'Percorso demo con repository, issue guidate, tutoraggio e revisione del lavoro. Nessun credito universitario automatico.',price:'FREE',requests:12,availability:'Prossima coorte',details:[['Formato','Online + repository GitHub'],['Validazione','Docente/ateneo se autorizzato']]},
  {id:'demo-thesis',icon:'📘',name:'Tesi MyZubster Demo',category:'thesis_project',location:'Italia',offer:'Proposta di tesi su AI, comunità ed economia circolare',description:'Tema dimostrativo da concordare con un relatore universitario, con codice e documentazione pubblica quando possibile.',price:'FREE',requests:5,availability:'Candidature aperte',details:[['Output','Tesi + repository'],['Approvazione','Relatore richiesta']]},
  {id:'demo-research',icon:'🔬',name:'Ricerca Riproducibile Demo',category:'research_project',location:'Europa',offer:'Studio interdisciplinare con dataset autorizzati e protocollo GitHub',description:'Progetto demo per ricercatori e studenti: dati con provenienza, metodo versionato e revisione umana.',price:'FREE',requests:8,availability:'Collaboratori cercati',details:[['Metodo','Riproducibile'],['Dati','Autorizzati e minimizzati']]},
  {id:'demo-internship',icon:'🧪',name:'Tirocinio Open Source Demo',category:'internship',location:'Ibrido',offer:'Percorso pratico su issue, test e pull request MyZubster',description:'Tirocinio dimostrativo: il riconoscimento formale richiede accordo e approvazione dell’università.',price:'FREE',requests:10,availability:'Da concordare',details:[['Attività','Issue + test + PR'],['Riconoscimento','Non automatico']]},
  {id:'demo-dog-sitter-request',icon:'🐕',name:'Cerco Dog Sitter Demo',category:'pet_services',location:'Emilia-Romagna',offer:'Cerco dog sitter affidabile per il mio cane',description:'Richiesta demo per trovare una persona disponibile a occuparsi del cane per alcune ore.',price:'15 EUR',requests:7,availability:'Weekend',details:[['Animale','Cane'],['Servizio','Custodia e passeggiata']]}
];
const DEMO_IMAGES={
  'demo-kefir':'/images/marketplace/demo/produce-kefir.png',
  'demo-repair':'/images/marketplace/demo/circular-repair.png',
  'demo-seeds':'/images/marketplace/demo/seeds-semi-locali.png',
  'demo-plants':'/images/marketplace/demo/plants-piantine-orto.png',
  'demo-pet-lost-found':'/images/marketplace/demo/animals-cane-smarrito-max.jpg',
  'demo-pet-services':'/images/marketplace/demo/animals-dog-sitter-leo.jpg',
  'demo-preserves':'/images/marketplace/demo/produce-conserve.png',
  'demo-plumber':'/images/marketplace/demo/idraulico-perdita-lavello.png',
  'demo-pc-repair':'/images/marketplace/demo/tecnico-pc-computer-guasto.png',
  'demo-network-tech':'/images/marketplace/demo/sistemista-router-offline.png',
  'demo-mason':'/images/marketplace/demo/muratore-muro-danneggiato.png',
  'demo-electrician':'/images/marketplace/demo/elettricista-presa-guasta.png',
  'demo-art-original':'/images/marketplace/demo/arte-dipinto-originale.png',
  'demo-wellness-braids':'/images/marketplace/demo/benessere-rasta-treccine.png',
  'demo-wellness-nails':'/images/marketplace/demo/benessere-nail-art.png',
  'demo-dog-sitter-request':'/images/marketplace/demo/animals-cerco-dog-sitter.jpg',
  'demo-sound-system':'/images/marketplace/demo/sound-system-collective.jpg',
  'demo-audio-gear':'/images/marketplace/demo/underground-audio-gear.jpg',
  'demo-event-tech':'/images/marketplace/demo/sound-system-collective.jpg',
  'demo-subculture-wear':'/images/marketplace/demo/upcycled-accessories.jpg',
  'demo-event-sound-rental':'/images/marketplace/demo/sound-system-collective.jpg',
  'demo-event-machines':'/images/marketplace/demo/underground-audio-gear.jpg',
  'demo-dj-package':'/images/marketplace/demo/dj-crew.jpg',
  'demo-accessories':'/images/marketplace/demo/upcycled-accessories.jpg',
  'demo-volunteering':'/images/marketplace/demo/community-garden-volunteers.jpg',
  'demo-pet-adoption':'/images/marketplace/demo/responsible-pet-adoption.jpg',
  'demo-university-course':'/images/marketplace/demo/corso-open-source.jpg',
  'demo-thesis':'/images/marketplace/demo/tesi-demo.jpg',
  'demo-research':'/images/marketplace/demo/ricerca-riproducibile-laboratorio.jpg',
  'demo-internship':'/images/marketplace/demo/tirocinio-open-source.jpg'
};

function demoPaymentMode(price=''){if(price==='FREE')return'FREE';if(price==='BARTER')return'BARTER';if(/MYZ/i.test(price))return'MYZ';if(/EUR|€/i.test(price))return'EUR';return'OTHER'}
function filterDemoSellers(rows,{category='',location='',query='',payment=''}){const q=query.trim().toLowerCase(),place=location.trim().toLowerCase();return rows.filter(row=>(!category||row.category===category)&&(!place||row.location.toLowerCase().includes(place))&&(!payment||demoPaymentMode(row.price)===payment)&&(!q||[row.name,row.offer,row.description,row.category,row.location].some(v=>String(v||'').toLowerCase().includes(q))))}
function isDemoDeepLink(search=''){return new URLSearchParams(search).get('demo')==='1'}
function getInitialCategory(search=''){return new URLSearchParams(search||window.location.search).get('category')||''}
function resolveFilterCategories(category,catalog=[],standard=categories){return[...new Set([...(category?[category]:[]),...standard,...catalog])]}

const BASE_COPY={
  title:'Publish your offer and receive real requests',
  intro:'Create a Seller space for products, services or projects. Browsing stays free.',
  seller:'Open your MyZubster Seller space',
  activate:'Become a Seller · Free',
  active:'Seller active',
  publish:'Publish listing',
  close:'Close',
  desc:'Description',
  place:'Location',
  price:'Price',
  send:'Publish',
  all:'All categories',
  filter:'Filter location',
  refresh:'Refresh',
  loading:'Loading listings…',
  empty:'No public listings yet',
  first:'You can be the first to publish one.',
  request:'Request',
  requestListingModal:'Request listing / Contact seller',
  requestNotePlaceholder:'Add an optional message or note for the seller (e.g. availability, preferred meeting spot, delivery details)…',
  requestQuantity:'Quantity',
  requestSend:'Send request',
  requestSending:'Sending request…',
  requestSuccess:'✓ Request submitted successfully! The seller can review it under incoming requests. You can track this in your orders.',
  requestLoginPrompt:'Please sign in to contact the seller or request this listing.',
  loginToRequest:'Sign in to request',
  selfRequestError:'You cannot request your own listing.',
  free:'Free',
  barter:'Barter',
  login:'Sign in before becoming a Seller.',
  activating:'Activating your free Seller profile…',
  published:'Listing published.',
  why:'What you get',
  benefits:['Publish products, services and projects','Manage listings and availability','Receive requests from the community','Build reputation from completed exchanges'],
  buyer:'Buying and discovering stays free.',
  terms:'Publish for free. Payment onboarding starts only when you have a real paid transaction or request a payout. MyZubster commission on eligible paid transactions: 2%. Listings support EUR and direct crypto agreements (BTC, ETH, XMR, MYZ); escrow and automated checkout are unvalidated without prior testing.',
  fromZorgax:'Zorgax brought you here: turn your idea into a real Seller space.',
  success:'Seller activated for free. Publish now; payment setup is requested only when you start earning.',
  cohort:'Founding Seller cohort',
  cohortText:'We are forming the first group of real offers and measuring verifiable requests. No sales are promised.',
  wallet:'Wallets and digital payments',
  formTitle:'Title',
  myListings:'My listings',
  edit:'Edit',
  editListing:'Edit listing',
  saveChanges:'Save changes',
  updated:'Listing updated successfully.',
  cancel:'Cancel',
  activeCategoryFilter:'Active category filter',
  clearFilter:'Show all categories',
  loadMore:'Load older listings',
  loadingMore:'Loading more listings…',
  demoTitle:'Marketplace Demo v2',
  demoNote:'Interactive demonstration profiles. Demo listings are sample content and never create real transactions.',
  demoBadge:'DEMO',
  demoOffer:'Example offer',
  demoRequests:'simulated requests',
  demoTry:'Create your real Seller',
  demoSearch:'Search demos',
  demoPayment:'Demo payment type',
  demoAllPayments:'All demo modes',
  demoDetails:'Open demo',
  demoAvailability:'Availability',
  demoRequest:'Try request flow',
  demoWarning:'DEMO ONLY — no order, payment, message or personal data is created.',
  demoReview:'Review simulated request',
  demoConfirm:'Confirm simulated request',
  demoConfirmed:'Demo request confirmed locally. Nothing was sent and no payment was created.',
  demoBack:'Back to demos',
  demoLocalReview:'This confirmation changes only the demo state in your browser.',
  noDemoMatches:'No demo matches the selected filters.',
  closeDemo:'Close demo',
  newCategory:'Create category',
  categoryName:'Category name',
  categoryDescription:'What should this category contain?',
  categorySubmit:'Send category proposal',
  categoryPending:'Category created for your listings. It becomes globally selectable after approval.',
  knowledge:'Share knowledge',
  knowledgeTitle:'Share a knowledge contribution',
  knowledgeCategory:'Knowledge category',
  knowledgeDescription:'Explain the know-how, method, guide or practical knowledge you want to share',
  knowledgeReference:'Public source/reference (optional)',
  knowledgeSubmit:'Send for review',
  knowledgeSaved:'Knowledge saved for review. No MYZ reward is automatic.',
  knowledgeNotice:'Knowledge contributions are reviewed separately. Creating one does not automatically award MYZ.',
  incomingRequests:'Incoming requests',
  myRequests:'My requests',
  browseListings:'Browse listings',
  noIncomingRequests:'No incoming requests for your listings yet.',
  noMyRequests:'You have not sent any requests yet. Browse the Marketplace and request a listing!',
  loadingOrders:'Loading requests…',
  accept:'Accept',
  decline:'Decline',
  cancelOrder:'Cancel request',
  orderAccepted:'Request accepted successfully.',
  orderDeclined:'Request declined.',
  orderCompleted:'Request completed successfully.',
  orderCancelled:'Request cancelled.',
  orderReference:'Order reference',
  statusRequested:'Pending approval',
  statusAccepted:'Accepted',
  statusRejected:'Declined',
  statusCompleted:'Completed',
  statusCancelled:'Cancelled',
  duplicateRequestError:'You already have an open request for this listing.',
  viewMyRequests:'View my requests',
  viewIncomingRequests:'View incoming requests',
  buyerRoleLabel:'Buyer',
  sellerRoleLabel:'Seller',
  refreshOrders:'Refresh requests'
};

const C={
  en:BASE_COPY,
  it:{
    ...BASE_COPY,
    title:'Pubblica la tua offerta e ricevi richieste reali',
    intro:'Crea uno spazio Seller per prodotti, servizi o progetti. Il Marketplace resta gratuito per chi cerca e acquista.',
    seller:'Apri il tuo spazio Seller MyZubster',
    activate:'Diventa Seller gratis',
    active:'Seller attivo',
    publish:'Pubblica annuncio',
    close:'Chiudi',
    desc:'Descrizione',
    place:'Località',
    price:'Prezzo',
    send:'Pubblica',
    all:'Tutte le categorie',
    filter:'Filtra località',
    refresh:'Aggiorna',
    loading:'Caricamento annunci…',
    empty:'Nessun annuncio pubblico per ora',
    first:'Puoi essere il primo a pubblicarne uno.',
    request:'Richiedi',
    requestListingModal:'Richiedi annuncio / Contatta venditore',
    requestNotePlaceholder:'Aggiungi un messaggio opzionale per il venditore (es. disponibilità, accordi di incontro, dettagli di consegna)…',
    requestQuantity:'Quantità',
    requestSend:'Invia richiesta',
    requestSending:'Invio richiesta in corso…',
    requestSuccess:'✓ Richiesta registrata con successo! Il venditore potrà esaminarla nelle sue richieste ricevute. Puoi seguire lo stato nei tuoi ordini.',
    requestLoginPrompt:'Accedi per contattare il venditore o inviare una richiesta per questo annuncio.',
    loginToRequest:'Accedi per richiedere',
    selfRequestError:'Non puoi richiedere il tuo stesso annuncio.',
    free:'Gratis',
    barter:'Baratto',
    login:'Per diventare Seller devi prima accedere a MyZubster.',
    activating:'Attivazione gratuita del profilo Seller…',
    published:'Annuncio pubblicato.',
    why:'Cosa ottieni',
    benefits:['Pubblica prodotti, servizi e progetti','Gestisci annunci e disponibilità','Ricevi richieste dalla community','Costruisci reputazione dagli scambi completati'],
    buyer:'Per chi compra e scopre il Marketplace resta gratuito.',
    terms:'Pubblica gratis. L’onboarding dei pagamenti parte solo al primo incasso reale o quando chiedi di ricevere un pagamento. Commissione MyZubster sulle transazioni pagate idonee: 2%. Gli annunci supportano EUR e pagamenti diretti in criptovalute (BTC, ETH, XMR, MYZ); escrow e checkout automatico non sono operativi senza test preventivi.',
    fromZorgax:'Zorgax ti ha portato qui: ora puoi trasformare la tua idea in uno spazio Seller reale.',
    success:'Seller attivato gratis. Pubblica ora; configuri i pagamenti solo quando inizi a guadagnare.',
    cohort:'Cohort Founding Seller',
    cohortText:'Stiamo formando il primo gruppo di offerte reali e raccogliendo richieste verificabili. Nessuna promessa di vendite.',
    wallet:'Wallet e pagamenti digitali',
    formTitle:'Titolo',
    myListings:'I miei annunci',
    edit:'Modifica',
    editListing:'Modifica annuncio',
    saveChanges:'Salva modifiche',
    updated:'Annuncio modificato con successo.',
    cancel:'Annulla',
    activeCategoryFilter:'Filtro categoria attivo',
    clearFilter:'Mostra tutte le categorie',
    loadMore:'Carica altri annunci',
    loadingMore:'Caricamento altri annunci…',
    demoTitle:'Marketplace Demo v2',
    demoNote:'Profili dimostrativi interattivi. Gli annunci demo sono contenuti di esempio e non creano transazioni reali.',
    demoOffer:'Offerta di esempio',
    demoRequests:'richieste simulate',
    demoTry:'Crea il tuo Seller reale',
    demoSearch:'Cerca nelle demo',
    demoPayment:'Tipo pagamento demo',
    demoAllPayments:'Tutte le modalità demo',
    demoDetails:'Apri demo',
    demoAvailability:'Disponibilità',
    demoRequest:'Prova flusso richiesta',
    demoWarning:'SOLO DEMO — non viene creato alcun ordine, pagamento, messaggio o dato personale.',
    demoReview:'Rivedi richiesta simulata',
    demoConfirm:'Conferma richiesta simulata',
    demoConfirmed:'Richiesta demo confermata solo localmente. Non è stato inviato nulla e non è stato creato alcun pagamento.',
    demoBack:'Torna alle demo',
    demoLocalReview:'Questa conferma modifica solo lo stato della demo nel browser.',
    noDemoMatches:'Nessuna demo corrisponde ai filtri selezionati.',
    closeDemo:'Chiudi demo',
    newCategory:'Crea categoria',
    categoryName:'Nome categoria',
    categoryDescription:'Cosa deve contenere questa categoria?',
    categorySubmit:'Invia proposta categoria',
    categoryPending:'Categoria creata per i tuoi annunci. Diventa globale dopo approvazione.',
    knowledge:'Condividi conoscenza',
    knowledgeTitle:'Condividi una conoscenza',
    knowledgeCategory:'Categoria della conoscenza',
    knowledgeDescription:'Descrivi il sapere, metodo, guida o competenza pratica che vuoi condividere',
    knowledgeReference:'Fonte/riferimento pubblico (opzionale)',
    knowledgeSubmit:'Invia per revisione',
    knowledgeSaved:'Conoscenza salvata per revisione. Nessun premio MYZ è automatico.',
    knowledgeNotice:'Le conoscenze vengono revisionate separatamente. La creazione non assegna automaticamente MYZ.',
    incomingRequests:'Richieste ricevute',
    myRequests:'Le mie richieste',
    browseListings:'Catalogo annunci',
    noIncomingRequests:'Nessuna richiesta ricevuta per i tuoi annunci per ora.',
    noMyRequests:'Non hai ancora inviato alcuna richiesta. Esplora il Marketplace e contatta un venditore!',
    loadingOrders:'Caricamento richieste…',
    accept:'Accetta',
    decline:'Rifiuta',
    cancelOrder:'Annulla richiesta',
    orderAccepted:'Richiesta accettata con successo.',
    orderDeclined:'Richiesta rifiutata.',
    orderCompleted:'Scambio completato con successo.',
    orderCancelled:'Richiesta annullata.',
    orderReference:'Riferimento ordine',
    statusRequested:'In attesa di approvazione',
    statusAccepted:'Accettata',
    statusRejected:'Rifiutata',
    statusCompleted:'Completata',
    statusCancelled:'Annullata',
    duplicateRequestError:'Hai già una richiesta aperta per questo annuncio.',
    viewMyRequests:'Visualizza le mie richieste',
    viewIncomingRequests:'Visualizza richieste ricevute',
    buyerRoleLabel:'Acquirente',
    sellerRoleLabel:'Venditore',
    refreshOrders:'Aggiorna richieste'
  },
  es:{
    ...BASE_COPY,
    title:'Publica tu oferta y recibe solicitudes reales',
    intro:'Crea un espacio Seller para productos, servicios o proyectos. Explorar el Marketplace sigue siendo gratis.',
    seller:'Abre tu espacio Seller de MyZubster',
    activate:'Hazte Seller gratis',
    active:'Seller activo',
    publish:'Publicar anuncio',
    close:'Cerrar',
    desc:'Descripción',
    place:'Ubicación',
    price:'Precio',
    send:'Publicar',
    all:'Todas las categorías',
    filter:'Filtrar ubicación',
    refresh:'Actualizar',
    loading:'Cargando anuncios…',
    empty:'Todavía no hay anuncios públicos',
    first:'Puedes ser la primera persona en publicar uno.',
    request:'Solicitar',
    requestListingModal:'Solicitar anuncio / Contactar al vendedor',
    requestNotePlaceholder:'Añade un mensaje opcional para el vendedor (disponibilidad, detalles de entrega, etc.)…',
    requestQuantity:'Cantidad',
    requestSend:'Enviar solicitud',
    requestSending:'Enviando solicitud…',
    requestSuccess:'✓ ¡Solicitud registrada con éxito! El vendedor podrá revisarla en sus solicitudes recibidas. Puedes seguir el estado en tus pedidos.',
    requestLoginPrompt:'Inicia sesión para contactar al vendedor o solicitar este anuncio.',
    loginToRequest:'Iniciar sesión para solicitar',
    selfRequestError:'No puedes solicitar tu propio anuncio.',
    free:'Gratis',
    barter:'Trueque',
    login:'Inicia sesión antes de convertirte en Seller.',
    activating:'Activando tu perfil Seller gratuito…',
    published:'Anuncio publicado.',
    why:'Qué obtienes',
    benefits:['Pubblica productos, servicios y proyectos','Gestiona anuncios y disponibilidad','Recibe solicitudes de la comunidad','Construye reputación con intercambios completados'],
    buyer:'Comprar y descubrir en el Marketplace sigue siendo gratis.',
    terms:'Publica gratis. La configuración de pagos empieza solo con el primer ingreso real o cuando solicitas cobrar. Comisión MyZubster en transacciones pagadas elegibles: 2%. Los anuncios admiten EUR y pagos directos en cripto (BTC, ETH, XMR, MYZ); el escrow y el checkout no están operativos sin pruebas previas.',
    fromZorgax:'Zorgax te trajo aquí: convierte tu idea en un espacio Seller real.',
    success:'Seller activado gratis. Configurarás los pagos solo cuando empieces a ganar.',
    cohort:'Cohorte Founding Seller',
    cohortText:'Estamos formando el primer grupo de ofertas reales y midiendo solicitudes verificables. No se prometen ventas.',
    wallet:'Wallets y pagos digitales',
    formTitle:'Título',
    myListings:'Mis anuncios',
    edit:'Editar',
    editListing:'Editar anuncio',
    saveChanges:'Guardar cambios',
    updated:'Anuncio modificado con éxito.',
    cancel:'Cancelar',
    activeCategoryFilter:'Filtro de categoría activo',
    clearFilter:'Mostrar todas las categorías',
    loadMore:'Cargar más anuncios',
    loadingMore:'Cargando más anuncios…',
    demoTitle:'Marketplace Demo v2',
    demoNote:'Perfiles interactivos de demostración. Los anuncios demo son contenido de ejemplo y nunca crean transacciones reales.',
    demoBadge:'DEMO',
    demoOffer:'Oferta de ejemplo',
    demoRequests:'solicitudes simuladas',
    demoTry:'Crea tu Seller real',
    demoSearch:'Buscar demos',
    demoPayment:'Tipo de pago demo',
    demoAllPayments:'Todos los modos demo',
    demoDetails:'Abrir demo',
    demoAvailability:'Disponibilidad',
    demoRequest:'Probar flujo de solicitud',
    demoWarning:'SOLO DEMO — no se crea ningún pedido, pago, mensaje ni dato personal.',
    demoReview:'Revisar solicitud simulada',
    demoConfirm:'Confirmar solicitud simulada',
    demoConfirmed:'Solicitud demo confirmada solo localmente. No se envió nada ni se creó ningún pago.',
    demoBack:'Volver a las demos',
    demoLocalReview:'Esta confirmación solo cambia el estado de la demo en tu navegador.',
    noDemoMatches:'Ninguna demo coincide con los filtros seleccionados.',
    closeDemo:'Cerrar demo',
    incomingRequests:'Solicitudes recibidas',
    myRequests:'Mis solicitudes',
    browseListings:'Explorar anuncios',
    noIncomingRequests:'No hay solicitudes recibidas para tus anuncios por ahora.',
    noMyRequests:'Aún no has enviado ninguna solicitud. ¡Explora el Marketplace y solicita un anuncio!',
    loadingOrders:'Cargando solicitudes…',
    accept:'Aceptar',
    decline:'Rechazar',
    cancelOrder:'Cancelar solicitud',
    orderAccepted:'Solicitud aceptada con éxito.',
    orderDeclined:'Solicitud rechazada.',
    orderCompleted:'Solicitud completada con éxito.',
    orderCancelled:'Solicitud cancelada.',
    orderReference:'Referencia del pedido',
    statusRequested:'Pendiente de aprobación',
    statusAccepted:'Aceptada',
    statusRejected:'Rechazada',
    statusCompleted:'Completada',
    statusCancelled:'Cancelada',
    duplicateRequestError:'Ya tienes una solicitud abierta para este anuncio.',
    viewMyRequests:'Ver mis solicitudes',
    viewIncomingRequests:'Ver solicitudes recibidas',
    buyerRoleLabel:'Comprador',
    sellerRoleLabel:'Vendedor',
    refreshOrders:'Actualizar solicitudes'
  },
  fr:{
    ...BASE_COPY,
    title:'Publiez votre offre et recevez de vraies demandes',
    intro:'Créez un espace Seller pour des produits, services ou projets. La consultation du Marketplace reste gratuite.',
    seller:'Ouvrez votre espace Seller MyZubster',
    activate:'Devenir Seller gratuitement',
    active:'Seller actif',
    publish:'Publier une annonce',
    close:'Fermer',
    desc:'Description',
    place:'Localisation',
    price:'Prix',
    send:'Publier',
    all:'Toutes les catégories',
    filter:'Filtrer la localisation',
    refresh:'Actualiser',
    loading:'Chargement des annonces…',
    empty:'Aucune annonce publique pour le moment',
    first:'Vous pouvez être la première personne à en publier une.',
    request:'Demander',
    requestListingModal:'Demander l’annonce / Contacter le vendeur',
    requestNotePlaceholder:'Ajoutez un message facultatif pour le vendeur (disponibilités, détails de livraison)…',
    requestQuantity:'Quantité',
    requestSend:'Envoyer la demande',
    requestSending:'Envoi de la demande…',
    requestSuccess:'✓ Demande enregistrée avec succès ! Le vendeur pourra l’examiner dans ses demandes reçues. Vous pouvez suivre l’état dans vos commandes.',
    requestLoginPrompt:'Connectez-vous pour contacter le vendeur ou demander cette annonce.',
    loginToRequest:'Se connecter pour demander',
    selfRequestError:'Vous ne pouvez pas demander votre propre annonce.',
    free:'Gratuit',
    barter:'Troc',
    login:'Connectez-vous avant de devenir Seller.',
    activating:'Activation de votre profil Seller gratuit…',
    published:'Annonce publiée.',
    why:'Ce que vous obtenez',
    benefits:['Publiez des produits, services et projets','Gérez les annonces et les disponibilités','Recevez des demandes de la communauté','Construisez votre réputation grâce aux échanges réalisés'],
    buyer:'Acheter et découvrir le Marketplace reste gratuit.',
    terms:'Publiez gratuitement. L’onboarding des paiements commence seulement au premier revenu réel ou lorsque vous demandez un paiement. Commission MyZubster sur les transactions payées éligibles : 2%. Les annonces prennent en charge EUR et paiements directs en crypto (BTC, ETH, XMR, MYZ) ; l’escrow et le checkout ne sont pas actifs sans tests préalables.',
    fromZorgax:'Zorgax vous a amené ici : transformez votre idée en véritable espace Seller.',
    success:'Seller activé gratuitement. Les paiements ne sont configurés que lorsque vous commencez à gagner.',
    cohort:'Cohorte Founding Seller',
    cohortText:'Nous constituons le premier groupe d’offres réelles et mesurons des demandes vérifiables. Aucune vente n’est garantie.',
    wallet:'Wallets et paiements numériques',
    formTitle:'Titre',
    myListings:'Mes annonces',
    edit:'Modifier',
    editListing:'Modifier l’annonce',
    saveChanges:'Enregistrer les modifications',
    updated:'Annonce mise à jour avec succès.',
    cancel:'Annuler',
    activeCategoryFilter:'Filtre de catégorie actif',
    clearFilter:'Afficher toutes les catégories',
    loadMore:'Charger plus d’annonces',
    loadingMore:'Chargement des annonces…',
    demoTitle:'Marketplace Demo v2',
    demoNote:'Profils de démonstration interactifs. Les annonces demo sont des exemples et ne créent jamais de transaction réelle.',
    demoBadge:'DEMO',
    demoOffer:'Offre exemple',
    demoRequests:'demandes simulées',
    demoTry:'Créez votre vrai Seller',
    demoSearch:'Rechercher dans les demos',
    demoPayment:'Type de paiement demo',
    demoAllPayments:'Tous les modes demo',
    demoDetails:'Ouvrir la demo',
    demoAvailability:'Disponibilité',
    demoRequest:'Tester le parcours de demande',
    demoWarning:'DEMO UNIQUEMENT — aucune commande, paiement, message ou donnée personnelle n’est créé.',
    demoReview:'Vérifier la demande simulée',
    demoConfirm:'Confirmer la demande simulée',
    demoConfirmed:'Demande demo confirmée uniquement localement. Rien n’a été envoyé et aucun paiement n’a été créé.',
    demoBack:'Retour aux demos',
    demoLocalReview:'Cette confirmation modifie uniquement l’état de la demo dans votre navigateur.',
    noDemoMatches:'Aucune demo ne correspond aux filtres sélectionnés.',
    closeDemo:'Fermer la demo',
    incomingRequests:'Demandes reçues',
    myRequests:'Mes demandes',
    browseListings:'Explorer les annonces',
    noIncomingRequests:'Aucune demande reçue pour vos annonces pour le moment.',
    noMyRequests:'Vous n’avez encore envoyé aucune demande. Parcourez le Marketplace et contactez un vendeur !',
    loadingOrders:'Chargement des demandes…',
    accept:'Accepter',
    decline:'Refuser',
    cancelOrder:'Annuler la demande',
    orderAccepted:'Demande acceptée avec succès.',
    orderDeclined:'Demande refusée.',
    orderCompleted:'Demande complétée avec succès.',
    orderCancelled:'Demande annulée.',
    orderReference:'Référence de la commande',
    statusRequested:'En attente d’approbation',
    statusAccepted:'Acceptée',
    statusRejected:'Refusée',
    statusCompleted:'Terminée',
    statusCancelled:'Annulée',
    duplicateRequestError:'Vous avez déjà une demande en cours pour cette annonce.',
    viewMyRequests:'Voir mes demandes',
    viewIncomingRequests:'Voir les demandes reçues',
    buyerRoleLabel:'Acheteur',
    sellerRoleLabel:'Vendeur',
    refreshOrders:'Actualiser les demandes'
  },
  de:{
    ...BASE_COPY,
    title:'Veröffentliche dein Angebot und erhalte echte Anfragen',
    intro:'Erstelle einen Seller-Bereich für Produkte, Dienstleistungen oder Projekte. Das Durchsuchen des Marketplace bleibt kostenlos.',
    seller:'Öffne deinen MyZubster Seller-Bereich',
    activate:'Seller kostenlos aktivieren',
    active:'Seller aktiv',
    publish:'Anzeige veröffentlichen',
    close:'Schließen',
    desc:'Beschreibung',
    place:'Standort',
    price:'Preis',
    send:'Veröffentlichen',
    all:'Alle Kategorien',
    filter:'Standort filtern',
    refresh:'Aktualisieren',
    loading:'Anzeigen werden geladen…',
    empty:'Noch keine öffentlichen Anzeigen',
    first:'Du kannst die erste Anzeige veröffentlichen.',
    request:'Anfragen',
    requestListingModal:'Angebot anfragen / Verkäufer kontaktieren',
    requestNotePlaceholder:'Optionale Nachricht für den Verkäufer hinzufügen (z. B. Verfügbarkeit, Details)…',
    requestQuantity:'Menge',
    requestSend:'Anfrage senden',
    requestSending:'Anfrage wird gesendet…',
    requestSuccess:'✓ Anfrage erfolgreich gespeichert! Der Verkäufer kann sie unter eingehenden Anfragen prüfen. Du kannst den Status in deinen Bestellungen verfolgen.',
    requestLoginPrompt:'Bitte melden Sie sich an, um den Verkäufer zu kontaktieren oder dieses Angebot anzufragen.',
    loginToRequest:'Anmelden zum Anfragen',
    selfRequestError:'Du kannst dein eigenes Angebot nicht anfragen.',
    free:'Kostenlos',
    barter:'Tausch',
    login:'Melde dich an, bevor du Seller wirst.',
    activating:'Kostenloses Seller-Profil wird aktiviert…',
    published:'Anzeige veröffentlicht.',
    why:'Das erhältst du',
    benefits:['Produkte, Dienstleistungen und Projekte veröffentlichen','Anzeigen und Verfügbarkeit verwalten','Anfragen aus der Community erhalten','Reputation durch abgeschlossene Austausche aufbauen'],
    buyer:'Kaufen und Entdecken im Marketplace bleibt kostenlos.',
    terms:'Kostenlos veröffentlichen. Zahlungs-Onboarding beginnt erst beim ersten echten Verdienst oder wenn du eine Auszahlung anforderst. MyZubster-Provision auf berechtigte bezahlte Transaktionen: 2%. Anzeigen unterstützen EUR und direkte Krypto-Zahlungen (BTC, ETH, XMR, MYZ); Escrow und Checkout sind ohne Tests nicht aktiv.',
    fromZorgax:'Zorgax hat dich hierher geführt: Verwandle deine Idee in einen echten Seller-Bereich.',
    success:'Seller kostenlos aktiviert. Zahlungen richtest du erst ein, wenn du anfängst zu verdienen.',
    cohort:'Founding-Seller-Kohorte',
    cohortText:'Wir bilden die erste Gruppe echter Angebote und messen überprüfbare Anfragen. Verkäufe werden nicht versprochen.',
    wallet:'Wallets und digitale Zahlungen',
    formTitle:'Titel',
    myListings:'Meine Anzeigen',
    edit:'Bearbeiten',
    editListing:'Anzeige bearbeiten',
    saveChanges:'Änderungen speichern',
    updated:'Anzeige erfolgreich aktualisiert.',
    cancel:'Abbrechen',
    activeCategoryFilter:'Aktiver Kategoriefilter',
    clearFilter:'Alle Kategorien anzeigen',
    loadMore:'Weitere Anzeigen laden',
    loadingMore:'Lade weitere Anzeigen…',
    demoTitle:'Marketplace Demo v2',
    demoNote:'Interaktive Demoprofile. Demo-Anzeigen sind Beispielinhalte und erzeugen niemals echte Transaktionen.',
    demoBadge:'DEMO',
    demoOffer:'Beispielangebot',
    demoRequests:'simulierte Anfragen',
    demoTry:'Erstelle deinen echten Seller',
    demoSearch:'Demos durchsuchen',
    demoPayment:'Demo-Zahlungsart',
    demoAllPayments:'Alle Demo-Modi',
    demoDetails:'Demo öffnen',
    demoAvailability:'Verfügbarkeit',
    demoRequest:'Anfrageablauf testen',
    demoWarning:'NUR DEMO — es werden keine Bestellung, Zahlung, Nachricht oder personenbezogenen Daten erstellt.',
    demoReview:'Simulierte Anfrage prüfen',
    demoConfirm:'Simulierte Anfrage bestätigen',
    demoConfirmed:'Demo-Anfrage nur lokal bestätigt. Es wurde nichts gesendet und keine Zahlung erstellt.',
    demoBack:'Zurück zu den Demos',
    demoLocalReview:'Diese Bestätigung ändert nur den Demo-Status in deinem Browser.',
    noDemoMatches:'Keine Demo entspricht den ausgewählten Filtern.',
    closeDemo:'Demo schließen',
    incomingRequests:'Eingehende Anfragen',
    myRequests:'Meine Anfragen',
    browseListings:'Anzeigen durchsuchen',
    noIncomingRequests:'Noch keine eingehenden Anfragen für deine Angebote.',
    noMyRequests:'Du hast noch keine Anfragen gesendet. Durchsuche den Marketplace und kontaktiere einen Verkäufer!',
    loadingOrders:'Anfragen werden geladen…',
    accept:'Annehmen',
    decline:'Ablehnen',
    cancelOrder:'Anfrage stornieren',
    orderAccepted:'Anfrage erfolgreich angenommen.',
    orderDeclined:'Anfrage abgelehnt.',
    orderCompleted:'Anfrage erfolgreich abgeschlossen.',
    orderCancelled:'Anfrage storniert.',
    orderReference:'Bestellreferenz',
    statusRequested:'Wartet auf Genehmigung',
    statusAccepted:'Angenommen',
    statusRejected:'Abgelehnt',
    statusCompleted:'Abgeschlossen',
    statusCancelled:'Storniert',
    duplicateRequestError:'Du hast bereits eine offene Anfrage für dieses Angebot.',
    viewMyRequests:'Meine Anfragen anzeigen',
    viewIncomingRequests:'Eingehende Anfragen anzeigen',
    buyerRoleLabel:'Käufer',
    sellerRoleLabel:'Verkäufer',
    refreshOrders:'Anfragen aktualisieren'
  }
};

function authHeaders(extra={}){const token=localStorage.getItem('myzubster-token');return{...extra,...(token?{Authorization:`Bearer ${token}`}:{})}}

function MarketplacePage(){
  const params=useMemo(()=>new URLSearchParams(window.location.search),[]);
  const initialCategory=useMemo(()=>getInitialCategory(window.location.search),[]);
  const initialView=useMemo(()=>{
    const v=params.get('view')||params.get('tab')||'';
    if(['requests','my_requests'].includes(v))return'my_requests';
    if(['orders','incoming','incoming_orders'].includes(v))return'incoming_orders';
    if(['listings','my_listings'].includes(v))return'my_listings';
    return'browse';
  },[params]);

  const[lang,setLangState]=useState(getLanguage),t=C[lang]||C.en,[listings,setListings]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[category,setCategory]=useState(initialCategory),[location,setLocation]=useState(''),[showCreate,setShowCreate]=useState(false),[form,setForm]=useState({title:'',category:initialCategory||'services',description:'',location:'',price:'',currency:'FREE'}),[myListings,setMyListings]=useState([]),[editingListing,setEditingListing]=useState(null),[editForm,setEditForm]=useState({title:'',category:initialCategory||'services',description:'',location:'',price:'',currency:'FREE'}),[categoryCatalog,setCategoryCatalog]=useState(categories),[categoryProposal,setCategoryProposal]=useState({name:'',description:''}),[showCategoryProposal,setShowCategoryProposal]=useState(false),[showKnowledge,setShowKnowledge]=useState(false),[knowledgeForm,setKnowledgeForm]=useState({title:'',category:'knowledge',description:'',reference:''}),[knowledgeItems,setKnowledgeItems]=useState([]),[message,setMessage]=useState(''),[sellerPlan,setSellerPlan]=useState(null),[sellerState,setSellerState]=useState(null),[demoQuery,setDemoQuery]=useState(''),[demoPayment,setDemoPayment]=useState(''),[selectedDemo,setSelectedDemo]=useState(null),[demoFlow,setDemoFlow]=useState('idle');

  // Request & Order state (Issues #1680 & #1683)
  const[activeSection,setActiveSection]=useState(initialView);
  const[orders,setOrders]=useState([]);
  const[ordersLoading,setOrdersLoading]=useState(false);
  const[ordersError,setOrdersError]=useState('');
  const[updatingOrderId,setUpdatingOrderId]=useState(null);
  const[activeRequestListing,setActiveRequestListing]=useState(null);
  const[requestQuantity,setRequestQuantity]=useState(1);
  const[requestNote,setRequestNote]=useState('');
  const[requestSubmitting,setRequestSubmitting]=useState(false);
  const[requestError,setRequestError]=useState('');
  const[confirmedOrder,setConfirmedOrder]=useState(null);
  // Invalidate pending responses whenever the request dialog changes.
  const requestSessionRef=useRef(0);
  const requestInFlightRef=useRef(false);

  const demoDeepLink=useMemo(()=>isDemoDeepLink(window.location.search),[]);
  const demoSectionRef=useRef(null),demoDialogRef=useRef(null),requestDialogRef=useRef(null);
  const sellerSource=params.get('from')||params.get('utm_source')||'';
  const fromZorgax=sellerSource.toLowerCase().includes('zorgax')||params.get('intent')==='seller';
  const[chatOrder,setChatOrder]=useState(null),[chatMessages,setChatMessages]=useState([]),[chatText,setChatText]=useState(''),[chatLoading,setChatLoading]=useState(false),[chatSending,setChatSending]=useState(false),[chatError,setChatError]=useState('');
  const[page,setPage]=useState(1),[hasMore,setHasMore]=useState(false),[loadingMore,setLoadingMore]=useState(false);
  const filterCategories=useMemo(()=>resolveFilterCategories(category,categoryCatalog,demoCategories),[category,categoryCatalog]);
  const filteredDemos=useMemo(()=>filterDemoSellers(DEMO_SELLERS,{category,location,query:demoQuery,payment:demoPayment}),[category,location,demoQuery,demoPayment]);

  const isAuthenticated=Boolean(localStorage.getItem('myzubster-token'));
  const incomingOrders=useMemo(()=>orders.filter(o=>o.viewerRole==='SELLER'),[orders]);
  const myRequests=useMemo(()=>orders.filter(o=>o.viewerRole==='BUYER'),[orders]);

  const load=useCallback(async(targetPage=1)=>{if(targetPage===1){setLoading(true);setPage(1);}setError('');try{const p=new URLSearchParams();p.set('limit','50');p.set('page',String(targetPage));if(category)p.set('category',category);if(location)p.set('location',location);const r=await fetch(`/api/listings?${p}`),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||d.error||'Marketplace unavailable');const incoming=Array.isArray(d.listings)?d.listings:[];setListings(prev=>targetPage===1?incoming:[...prev,...incoming]);setHasMore(Boolean(d.hasMore))}catch(e){setError(e.message)}finally{if(targetPage===1)setLoading(false)}},[category,location]);
  const loadMore=useCallback(async()=>{if(loadingMore||!hasMore)return;setLoadingMore(true);const nextPage=page+1;try{const p=new URLSearchParams();p.set('limit','50');p.set('page',String(nextPage));if(category)p.set('category',category);if(location)p.set('location',location);const r=await fetch(`/api/listings?${p}`),d=await r.json().catch(()=>({}));if(r.ok&&Array.isArray(d.listings)){setListings(prev=>[...prev,...d.listings]);setPage(nextPage);setHasMore(Boolean(d.hasMore))}}catch(_){}finally{setLoadingMore(false)}},[category,location,page,hasMore,loadingMore]);
  const loadSeller=useCallback(async()=>{try{const r=await fetch('/api/marketplace/seller/plan'),d=await r.json().catch(()=>({}));if(r.ok)setSellerPlan(d.plan||null);if(!localStorage.getItem('myzubster-token'))return;const sr=await fetch('/api/marketplace/seller/me',{headers:authHeaders()}),sd=await sr.json().catch(()=>({}));if(sr.ok){setSellerState(sd);if(sd.active)trackConversionOnce('seller_free_active',{source:'seller_state'})}}catch(_){}},[]);
  const loadCategories=useCallback(async()=>{try{const r=await fetch('/api/listings/categories'),d=await r.json().catch(()=>({}));if(!r.ok)return;const standard=Array.isArray(d.standard)?d.standard:[];const custom=Array.isArray(d.custom)?d.custom.map(item=>item.slug).filter(Boolean):[];let mine=[];if(localStorage.getItem('myzubster-token')){const mr=await fetch('/api/listings/categories/mine',{headers:authHeaders()}),md=await mr.json().catch(()=>({}));if(mr.ok&&Array.isArray(md.proposals))mine=md.proposals.filter(item=>['pending','approved'].includes(item.status)).map(item=>item.slug).filter(Boolean)}setCategoryCatalog([...new Set([...categories,...standard,...custom,...mine])])}catch(_){}},[]);
  const loadKnowledge=useCallback(async()=>{if(!localStorage.getItem('myzubster-token'))return;try{const r=await fetch('/api/knowledge-rewards/mine',{headers:authHeaders()}),d=await r.json().catch(()=>({}));if(r.ok)setKnowledgeItems(Array.isArray(d.items)?d.items:[])}catch(_){}},[]);
  const loadChat=async(id)=>{setChatLoading(true);setChatError('');try{const r=await fetch(`/api/marketplace/orders/${encodeURIComponent(id)}/messages`,{headers:authHeaders()}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||d.error||'Conversazione non disponibile');setChatMessages(Array.isArray(d.messages)?d.messages:[])}catch(e){setChatError(e.message)}finally{setChatLoading(false)}};
  const openChat=async(o)=>{setChatOrder(o);setChatText('');setChatMessages([]);await loadChat(o._id)};
  const sendChat=async(e)=>{e.preventDefault();if(!chatOrder||!chatText.trim()||chatSending)return;setChatSending(true);setChatError('');try{const r=await fetch(`/api/marketplace/orders/${encodeURIComponent(chatOrder._id)}/messages`,{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify({body:chatText.trim()})}),d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.message||d.error||'Messaggio non inviato');setChatText('');await loadChat(chatOrder._id)}catch(e){setChatError(e.message)}finally{setChatSending(false)}};
  const loadMyListings=useCallback(async()=>{if(!localStorage.getItem('myzubster-token'))return;try{const r=await fetch('/api/listings/mine',{headers:authHeaders()}),d=await r.json().catch(()=>({}));if(r.ok&&Array.isArray(d.listings))setMyListings(d.listings)}catch(_){}},[]);

  const loadOrders=useCallback(async()=>{
    if(!localStorage.getItem('myzubster-token')){setOrders([]);return;}
    setOrdersLoading(true);setOrdersError('');
    try{
      const r=await fetch('/api/marketplace/orders/mine',{headers:authHeaders()});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.message||d.error||'Failed to load orders');
      setOrders(Array.isArray(d.orders)?d.orders:[]);
    }catch(err){
      setOrdersError(err.message||'Failed to load orders');
    }finally{
      setOrdersLoading(false);
    }
  },[]);

  useEffect(()=>{
    trackConversionOnce('marketplace_view',{path:'/marketplace'});
    trackConversionOnce('seller_offer_view',{source:sellerSource||'direct',fromZorgax});
    if(params.get('seller')==='success')setMessage(t.success);
    if(params.get('action')==='new'){
      if(localStorage.getItem('myzubster-token')){setShowCreate(true)}else{setMessage(t.login)}
    }
    load();loadSeller();loadCategories();loadKnowledge();loadMyListings();loadOrders();
  },[load,loadSeller,loadCategories,loadKnowledge,loadMyListings,loadOrders,fromZorgax,params,sellerSource,t.success,t.login]);

  useEffect(()=>{
    if(!demoDeepLink)return;
    const id=window.requestAnimationFrame(()=>{
      const el=demoSectionRef.current;if(!el)return;
      el.scrollIntoView({behavior:'smooth',block:'start'});
      el.focus({preventScroll:true});
      trackConversionOnce('marketplace_demo_deeplink_view',{source:sellerSource||'direct'});
    });
    return()=>window.cancelAnimationFrame(id);
  },[demoDeepLink,sellerSource]);

  useEffect(()=>{
    if(!selectedDemo)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const id=window.requestAnimationFrame(()=>demoDialogRef.current?.focus());
    const onKeyDown=e=>{if(e.key==='Escape')closeDemo()};
    window.addEventListener('keydown',onKeyDown);
    return()=>{window.cancelAnimationFrame(id);window.removeEventListener('keydown',onKeyDown);document.body.style.overflow=previous};
  },[selectedDemo]);

  useEffect(()=>{
    if(!activeRequestListing)return;
    const previous=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const id=window.requestAnimationFrame(()=>requestDialogRef.current?.focus());
    const onKeyDown=e=>{if(e.key==='Escape')closeRequestDialog()};
    window.addEventListener('keydown',onKeyDown);
    return()=>{window.cancelAnimationFrame(id);window.removeEventListener('keydown',onKeyDown);document.body.style.overflow=previous};
  },[activeRequestListing]);

  async function apiAction(url,body){
    const r=await fetch(url,{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(body)});
    const d=await r.json().catch(()=>({}));
    if(!r.ok){
      const e=new Error(d.message||d.error||'Operation failed');
      e.status=r.status;
      throw e;
    }
    return d;
  }

  async function becomeSeller(){
    trackConversion('seller_cta_clicked',{source:sellerSource||'direct',fromZorgax});
    const returnTo=`${window.location.pathname}${window.location.search}${window.location.hash}`;
    if(!localStorage.getItem('myzubster-token')){
      setMessage(t.login);
      window.location.assign(`/social-login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    try{
      setMessage(t.activating);
      const payload=await apiAction('/api/marketplace/seller/subscribe',{});
      setSellerState({active:true,membership:payload.membership,plan:payload.plan,sellerCanReceiveFunds:false});
      setSellerPlan(payload.plan||sellerPlan);
      setMessage(payload.message||t.success);
      trackConversion('seller_free_activated',{source:sellerSource||'direct',fromZorgax});
    }catch(e){
      trackConversion('seller_free_activation_error',{source:sellerSource||'direct',message:e.message});
      if(e.status===401){
        localStorage.removeItem('myzubster-token');
        window.location.assign(`/social-login?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      setMessage(e.message);
    }
  }

  async function createListing(e){
    e.preventDefault();
    try{
      await apiAction('/api/listings/create',{...form,price:['FREE','BARTER'].includes(form.currency)?0:Number(form.price)});
      setMessage(t.published);
      setShowCreate(false);
      setForm({title:'',category:initialCategory||'services',description:'',location:'',price:'',currency:'FREE'});
      await Promise.all([load(),loadMyListings()]);
    }catch(e){setMessage(e.message)}
  }

  function startEdit(item){
    setEditingListing(item);
    setEditForm({title:item.title||'',category:item.category||'services',description:item.description||'',location:item.location||'',price:item.price!=null?String(item.price):'',currency:item.currency||'FREE'});
  }
  function cancelEdit(){setEditingListing(null)}

  async function saveEdit(e){
    e.preventDefault();
    if(!editingListing)return;
    try{
      const payload={title:editForm.title.trim(),category:editForm.category,description:editForm.description.trim(),location:editForm.location.trim(),currency:editForm.currency,price:['FREE','BARTER'].includes(editForm.currency)?0:Number(editForm.price)};
      const r=await fetch(`/api/listings/${editingListing.id||editingListing._id}`,{method:'PATCH',headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(payload)});
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.message||d.error||'Failed to update listing');
      setMessage(t.updated);
      setEditingListing(null);
      await Promise.all([load(),loadMyListings()]);
    }catch(err){setMessage(err.message)}
  }

  async function proposeCategory(){
    const name=categoryProposal.name.trim();
    if(name.length<3){setMessage(t.categoryName);return}
    try{
      const payload=await apiAction('/api/listings/categories/propose',{name,description:categoryProposal.description.trim()});
      const slug=payload?.proposal?.slug||'';
      if(slug){setCategoryCatalog(current=>[...new Set([...current,slug])]);setForm(current=>({...current,category:slug}))}
      setCategoryProposal({name:'',description:''});
      setShowCategoryProposal(false);
      setMessage(t.categoryPending);
    }catch(e){setMessage(e.message)}
  }

  async function submitKnowledge(e){
    e.preventDefault();
    const returnTo=`${window.location.pathname}${window.location.search}${window.location.hash}`;
    if(!localStorage.getItem('myzubster-token')){
      setMessage(t.login);
      window.location.assign(`/social-login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    try{
      await apiAction('/api/knowledge-rewards/submissions',{...knowledgeForm,type:'community_knowledge'});
      setKnowledgeForm({title:'',category:'knowledge',description:'',reference:''});
      setMessage(t.knowledgeSaved);
      await loadKnowledge();
    }catch(e){setMessage(e.message)}
  }

  function openRequestDialog(l){
    const isMine=myListings.some(m=>(m.id||m._id)===(l.id||l._id));
    if(isMine){setMessage(t.selfRequestError);return}
    requestSessionRef.current+=1;
    requestInFlightRef.current=false;
    setRequestSubmitting(false);
    setActiveRequestListing(l);
    setRequestQuantity(1);
    setRequestNote('');
    setRequestError('');
    setConfirmedOrder(null);
  }

  function closeRequestDialog(){
    requestSessionRef.current+=1;
    requestInFlightRef.current=false;
    setActiveRequestListing(null);
    setRequestSubmitting(false);
    setRequestError('');
    setConfirmedOrder(null);
  }

  async function submitOrderRequest(e){
    if(e)e.preventDefault();
    if(!activeRequestListing||requestInFlightRef.current)return;
    const session=requestSessionRef.current;
    const returnTo=`${window.location.pathname}${window.location.search}${window.location.hash}`;
    if(!localStorage.getItem('myzubster-token')){
      setMessage(t.requestLoginPrompt);
      window.location.assign(`/social-login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    requestInFlightRef.current=true;
    setRequestSubmitting(true);
    setRequestError('');
    try{
      const res=await apiAction('/api/marketplace/orders',{
        listingId:activeRequestListing.id||activeRequestListing._id,
        quantity:Number(requestQuantity)||1,
        note:requestNote.trim()
      });
      if(session!==requestSessionRef.current)return;
      const created=res.order||{
        _id:`ord-${Date.now()}`,
        quantity:Number(requestQuantity)||1,
        status:'REQUESTED',
        note:requestNote.trim(),
        snapshot:{
          title:activeRequestListing.title,
          price:activeRequestListing.price,
          currency:activeRequestListing.currency
        }
      };
      setConfirmedOrder(created);
      trackConversion('marketplace_listing_requested',{
        listingId:activeRequestListing.id||activeRequestListing._id,
        currency:activeRequestListing.currency,
        price:activeRequestListing.price,
        quantity:Number(requestQuantity)||1
      });
      setMessage(t.requestSuccess);
      await loadOrders();
    }catch(err){
      if(session!==requestSessionRef.current)return;
      if(err.status===401){
        localStorage.removeItem('myzubster-token');
        setMessage(t.requestLoginPrompt);
        window.location.assign(`/social-login?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      if(err.status===409){
        setRequestError(t.duplicateRequestError||err.message);
      }else{
        setRequestError(err.message||'Request failed');
      }
      setMessage(err.message);
    }finally{
      if(session===requestSessionRef.current){
        requestInFlightRef.current=false;
        setRequestSubmitting(false);
      }
    }
  }

  async function updateOrderStatus(orderId,nextStatus){
    setUpdatingOrderId(orderId);
    try{
      const r=await fetch(`/api/marketplace/orders/${orderId}/status`,{
        method:'PATCH',
        headers:authHeaders({'Content-Type':'application/json'}),
        body:JSON.stringify({status:nextStatus})
      });
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(d.message||d.error||'Failed to update order');
      setMessage(nextStatus==='ACCEPTED'?t.orderAccepted:nextStatus==='REJECTED'?t.orderDeclined:nextStatus==='COMPLETED'?t.orderCompleted:t.orderCancelled);
      await loadOrders();
    }catch(err){
      setMessage(err.message);
    }finally{
      setUpdatingOrderId(null);
    }
  }

  function openDemo(demo){setSelectedDemo(demo);setDemoFlow('idle');trackConversion('marketplace_demo_opened',{demoId:demo.id,category:demo.category})}
  function closeDemo(){setSelectedDemo(null);setDemoFlow('idle')}
  function startDemoRequest(){setDemoFlow('review');trackConversion('marketplace_demo_request_started',{demoId:selectedDemo?.id})}
  function confirmDemoRequest(){setDemoFlow('confirmed');trackConversion('marketplace_demo_request_confirmed',{demoId:selectedDemo?.id})}

  const displayPrice=sellerPlan?.message||t.terms;
  const sellerCta=t.activate;
  const cardStyle={border:'1px dashed #2f9e66',padding:16,borderRadius:16,display:'flex',flexDirection:'column',gap:8,minWidth:0};

  return <main style={{padding:'clamp(14px,3vw,24px)',maxWidth:1100,margin:'0 auto'}}>
    <header>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
        <div>MYZUBSTER MARKETPLACE</div>
        <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <a href="/" aria-label="Torna alla homepage MyZubster" style={{display:'inline-block',padding:'9px 14px',borderRadius:10,background:'#047857',color:'#fff',fontWeight:700,textDecoration:'none'}}>🏠 Home</a>
          <select value={lang} onChange={e=>setLangState(setLanguage(e.target.value))}>
            {Object.entries(LANGUAGE_NAMES).map(([k,v])=><option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <h2>{t.title}</h2>
      <p>{t.intro}</p>
      {fromZorgax&&<p style={{padding:12,border:'1px solid #5b5bd6',borderRadius:12}}><strong>🤖 Zorgax → Marketplace</strong><br/>{t.fromZorgax}</p>}
      
      {!sellerState?.active?<section style={{margin:'18px 0',padding:'clamp(14px,3vw,20px)',border:'1px solid #555',borderRadius:16}}>
        <small>MYZUBSTER SELLER · FREE FIRST</small>
        <h3>{t.seller}</h3>
        <p style={{padding:12,border:'1px solid #2f9e66',borderRadius:12}}><strong>{t.cohort}</strong><br/>{t.cohortText}</p>
        <h4>{t.why}</h4>
        <ul>{t.benefits.map(x=><li key={x}>{x}</li>)}</ul>
        <p>{t.buyer}</p>
        <button onClick={becomeSeller}>{sellerCta}</button>
        <p style={{fontSize:13,opacity:.8}}>{displayPrice}</p>
      </section>:<section style={{margin:'18px 0',padding:'clamp(14px,3vw,20px)',border:'1px solid #2f9e66',borderRadius:16}}>
        <p><strong>✓ {t.active}.</strong></p>
        <p>{t.terms}</p>
      </section>}

      {params.get('action')==='new'&&!localStorage.getItem('myzubster-token')&&<section style={{margin:'16px 0',padding:16,border:'1px solid #38bdf8',borderRadius:14,background:'rgba(56,189,248,.08)'}}>
        <strong>➕ {t.publish}</strong>
        <p style={{margin:'6px 0 12px'}}>{t.login}</p>
        <a href={`/social-login?returnTo=${encodeURIComponent('/marketplace?action=new')}`} style={{display:'inline-block',padding:'10px 18px',background:'#0284c7',color:'#fff',borderRadius:10,textDecoration:'none',fontWeight:800}}>
          👤 {t.login.split('.')[0]||'Accedi'}
        </a>
      </section>}

      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button onClick={()=>setShowCreate(v=>!v)}>{showCreate?t.close:t.publish}</button>
        <button type="button" onClick={()=>setShowKnowledge(v=>!v)}>🧠 {showKnowledge?t.close:t.knowledge}</button>
      </div>
    </header>

    {/* Section Navigation Tabs (Issue #1683) */}
    <nav aria-label="Marketplace navigation" style={{display:'flex',gap:8,flexWrap:'wrap',margin:'22px 0 16px',borderBottom:'1px solid rgba(255,255,255,.12)',paddingBottom:14}}>
      <button
        type="button"
        onClick={()=>setActiveSection('browse')}
        style={{
          padding:'9px 18px',
          borderRadius:10,
          fontWeight:activeSection==='browse'?800:500,
          background:activeSection==='browse'?'#0284c7':'rgba(255,255,255,.06)',
          color:'#fff',
          border:activeSection==='browse'?'1px solid #38bdf8':'1px solid rgba(255,255,255,.15)',
          cursor:'pointer'
        }}
      >
        🛒 {t.browseListings}
      </button>

      {isAuthenticated&&(
        <>
          <button
            type="button"
            onClick={()=>{setActiveSection('incoming_orders');loadOrders();}}
            style={{
              padding:'9px 18px',
              borderRadius:10,
              fontWeight:activeSection==='incoming_orders'?800:500,
              background:activeSection==='incoming_orders'?'#059669':'rgba(255,255,255,.06)',
              color:'#fff',
              border:activeSection==='incoming_orders'?'1px solid #34d399':'1px solid rgba(255,255,255,.15)',
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              gap:6
            }}
          >
            📥 {t.incomingRequests}
            {incomingOrders.length>0&&(
              <span style={{background:'#34d399',color:'#0f172a',borderRadius:999,padding:'2px 7px',fontSize:11,fontWeight:800}}>
                {incomingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={()=>{setActiveSection('my_requests');loadOrders();}}
            style={{
              padding:'9px 18px',
              borderRadius:10,
              fontWeight:activeSection==='my_requests'?800:500,
              background:activeSection==='my_requests'?'#0284c7':'rgba(255,255,255,.06)',
              color:'#fff',
              border:activeSection==='my_requests'?'1px solid #38bdf8':'1px solid rgba(255,255,255,.15)',
              cursor:'pointer',
              display:'flex',
              alignItems:'center',
              gap:6
            }}
          >
            📤 {t.myRequests}
            {myRequests.length>0&&(
              <span style={{background:'#38bdf8',color:'#0f172a',borderRadius:999,padding:'2px 7px',fontSize:11,fontWeight:800}}>
                {myRequests.length}
              </span>
            )}
          </button>

          {myListings.length>0&&(
            <button
              type="button"
              onClick={()=>setActiveSection('my_listings')}
              style={{
                padding:'9px 18px',
                borderRadius:10,
                fontWeight:activeSection==='my_listings'?800:500,
                background:activeSection==='my_listings'?'#475569':'rgba(255,255,255,.06)',
                color:'#fff',
                border:activeSection==='my_listings'?'1px solid #94a3b8':'1px solid rgba(255,255,255,.15)',
                cursor:'pointer'
              }}
            >
              📦 {t.myListings} ({myListings.length})
            </button>
          )}
        </>
      )}
    </nav>

    {showCreate&&<form onSubmit={createListing} style={{display:'grid',gap:10,margin:'20px 0'}}>
      <input required placeholder={t.formTitle} value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <select style={{flex:'1 1 220px'}} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
          {categoryCatalog.map(cat=><option key={cat} value={cat}>{cat}</option>)}
        </select>
        <button type="button" onClick={()=>setShowCategoryProposal(v=>!v)}>+ {t.newCategory}</button>
      </div>
      {showCategoryProposal&&<fieldset style={{display:'grid',gap:8,border:'1px solid #555',borderRadius:10,padding:12}}>
        <legend>{t.newCategory}</legend>
        <input value={categoryProposal.name} onChange={e=>setCategoryProposal({...categoryProposal,name:e.target.value})} maxLength={80} placeholder={t.categoryName}/>
        <textarea value={categoryProposal.description} onChange={e=>setCategoryProposal({...categoryProposal,description:e.target.value})} maxLength={500} placeholder={t.categoryDescription}/>
        <button type="button" onClick={proposeCategory}>{t.categorySubmit}</button>
        <small>{t.categoryPending}</small>
      </fieldset>}
      <textarea placeholder={t.desc} value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
      <input placeholder={t.place} value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
      <select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}>
        {currencies.map(cur=><option key={cur}>{cur}</option>)}
      </select>
      {!['FREE','BARTER'].includes(form.currency)&&<input type="number" placeholder={t.price} value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>}
      <button>{t.send}</button>
    </form>}

    {showKnowledge&&<section style={{margin:'20px 0',padding:16,border:'1px solid #5b5bd6',borderRadius:14}}>
      <h3>🧠 {t.knowledgeTitle}</h3>
      <p>{t.knowledgeNotice}</p>
      <form onSubmit={submitKnowledge} style={{display:'grid',gap:10}}>
        <input required minLength={3} maxLength={180} placeholder={t.formTitle} value={knowledgeForm.title} onChange={e=>setKnowledgeForm({...knowledgeForm,title:e.target.value})}/>
        <input list="marketplaceKnowledgeCategories" maxLength={80} placeholder={t.knowledgeCategory} value={knowledgeForm.category} onChange={e=>setKnowledgeForm({...knowledgeForm,category:e.target.value})}/>
        <datalist id="marketplaceKnowledgeCategories">{categoryCatalog.map(cat=><option key={cat} value={cat}/>)}</datalist>
        <textarea maxLength={4000} placeholder={t.knowledgeDescription} value={knowledgeForm.description} onChange={e=>setKnowledgeForm({...knowledgeForm,description:e.target.value})}/>
        <input maxLength={500} placeholder={t.knowledgeReference} value={knowledgeForm.reference} onChange={e=>setKnowledgeForm({...knowledgeForm,reference:e.target.value})}/>
        <button>{t.knowledgeSubmit}</button>
      </form>
      {knowledgeItems.length>0&&<details style={{marginTop:12}}>
        <summary>Le mie conoscenze ({knowledgeItems.length})</summary>
        <ul>{knowledgeItems.slice(0,10).map(item=><li key={item._id||item.contributionId}><strong>{item.title}</strong> · {item.category||'knowledge'} · {item.status}</li>)}</ul>
      </details>}
    </section>}

    {editingListing&&<section style={{margin:'20px 0',padding:16,border:'2px solid #0284c7',borderRadius:14,background:'rgba(2,132,199,.06)'}}>
      <h3>✏️ {t.editListing}: {editingListing.title}</h3>
      <form onSubmit={saveEdit} style={{display:'grid',gap:10}}>
        <input required placeholder={t.formTitle} value={editForm.title} onChange={e=>setEditForm({...editForm,title:e.target.value})}/>
        <select value={editForm.category} onChange={e=>setEditForm({...editForm,category:e.target.value})}>
          {categoryCatalog.map(cat=><option key={cat} value={cat}>{cat}</option>)}
        </select>
        <textarea placeholder={t.desc} value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})}/>
        <input placeholder={t.place} value={editForm.location} onChange={e=>setEditForm({...editForm,location:e.target.value})}/>
        <select value={editForm.currency} onChange={e=>setEditForm({...editForm,currency:e.target.value})}>
          {currencies.map(cur=><option key={cur} value={cur}>{cur}</option>)}
        </select>
        {!['FREE','BARTER'].includes(editForm.currency)&&<input type="number" placeholder={t.price} value={editForm.price} onChange={e=>setEditForm({...editForm,price:e.target.value})}/>}
        <div style={{display:'flex',gap:8}}>
          <button type="submit">{t.saveChanges}</button>
          <button type="button" onClick={cancelEdit}>{t.cancel}</button>
        </div>
      </form>
    </section>}

    {chatOrder&&<section aria-label="Conversazione Marketplace" style={{border:'2px solid #047857',borderRadius:14,padding:16,margin:'16px 0'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}><h3>💬 Conversazione — {chatOrder.snapshot?.title||chatOrder.listingId?.title||'Richiesta'}</h3><button type="button" onClick={()=>setChatOrder(null)}>Chiudi</button></div><p>Stato richiesta: {chatOrder.status}</p><button type="button" disabled={chatLoading} onClick={()=>loadChat(chatOrder._id)}>Aggiorna messaggi</button>{chatError&&<p role="alert">{chatError}</p>}<div aria-live="polite" style={{margin:'12px 0',maxHeight:320,overflowY:'auto'}}>{chatLoading&&<p>Caricamento messaggi…</p>}{!chatLoading&&!chatMessages.length&&<p>Nessun messaggio. Scrivi per iniziare la conversazione.</p>}{chatMessages.map(m=><article key={m._id} style={{border:'1px solid #888',borderRadius:8,padding:10,margin:'8px 0',overflowWrap:'anywhere'}}><p style={{whiteSpace:'pre-wrap',margin:'0 0 6px'}}>{m.body}</p><small>{m.createdAt?new Date(m.createdAt).toLocaleString():''}</small></article>)}</div>{!['REJECTED','CANCELLED'].includes(chatOrder.status)?<form onSubmit={sendChat} style={{display:'grid',gap:8}}><label htmlFor="marketplace-chat-text">Scrivi un messaggio al cliente o venditore</label><textarea id="marketplace-chat-text" value={chatText} maxLength={2000} rows={3} onChange={e=>setChatText(e.target.value)} required/><button type="submit" disabled={chatSending||!chatText.trim()}>{chatSending?'Invio…':'Invia messaggio'}</button></form>:<p>Questa conversazione è chiusa.</p>}</section>}
    {message&&<p role="status">{message}</p>}

    {/* Section: Incoming Requests for Sellers (Issue #1683) */}
    {activeSection==='incoming_orders'&&(
      <section style={{margin:'20px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:14}}>
          <h3 style={{margin:0}}>📥 {t.incomingRequests} ({incomingOrders.length})</h3>
          <button type="button" onClick={loadOrders} disabled={ordersLoading} style={{padding:'6px 12px',fontSize:13,cursor:'pointer'}}>
            🔄 {ordersLoading?t.loadingOrders:t.refreshOrders}
          </button>
        </div>
        {ordersLoading&&<p>{t.loadingOrders}</p>}
        {ordersError&&<p role="alert" style={{color:'#f87171',background:'rgba(239,68,68,.1)',padding:10,borderRadius:8}}>⚠️ {ordersError}</p>}
        {!ordersLoading&&incomingOrders.length===0&&(
          <div style={{padding:24,border:'1px dashed #555',borderRadius:14,textAlign:'center',background:'rgba(255,255,255,.02)'}}>
            <p style={{margin:0,opacity:.85}}>{t.noIncomingRequests}</p>
          </div>
        )}
        {!ordersLoading&&incomingOrders.length>0&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',gap:14}}>
            {incomingOrders.map(order=>{
              const isPending=order.status==='REQUESTED';
              const isAccepted=order.status==='ACCEPTED';
              const isRejected=order.status==='REJECTED';
              const isCompleted=order.status==='COMPLETED';
              const statusBadgeBg=isPending?'#fef3c7':isAccepted?'#d1fae5':isRejected?'#fee2e2':isCompleted?'#ede9fe':'#f1f5f9';
              const statusBadgeColor=isPending?'#92400e':isAccepted?'#065f46':isRejected?'#991b1b':isCompleted?'#5b21b6':'#475569';
              const statusLabel=isPending?`⏳ ${t.statusRequested}`:isAccepted?`✓ ${t.statusAccepted}`:isRejected?`✕ ${t.statusRejected}`:isCompleted?`★ ${t.statusCompleted}`:`⊘ ${t.statusCancelled}`;
              const isUpdating=updatingOrderId===order._id;
              return(
                <article key={order._id} style={{border:'1px solid rgba(127,127,127,.35)',borderRadius:14,padding:16,background:'rgba(255,255,255,.02)',display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{padding:'3px 9px',borderRadius:999,background:statusBadgeBg,color:statusBadgeColor,fontWeight:700,fontSize:12}}>
                      {statusLabel}
                    </span>
                    <small style={{opacity:.65}}>#{String(order._id).slice(-6)}</small>
                  </div>
                  <h4 style={{margin:'4px 0 2px'}}>{order.snapshot?.title||order.listingId?.title||'Annuncio'}</h4>
                  <p style={{margin:0,fontSize:14}}>
                    <strong>{order.snapshot?.currency==='FREE'?t.free:order.snapshot?.currency==='BARTER'?t.barter:`${Number(order.snapshot?.price||0)*Number(order.quantity||1)} ${order.snapshot?.currency||''}`}</strong> · {t.requestQuantity}: {order.quantity}
                  </p>
                  {order.note?(
                    <div style={{background:'rgba(255,255,255,.05)',padding:10,borderRadius:8,fontSize:13,fontStyle:'italic',borderLeft:'3px solid #059669'}}>
                      💬 "{order.note}"
                    </div>
                  ):null}
                  {order.buyerUsername?(
                    <div style={{fontSize:12,opacity:.75}}>
                      👤 {t.buyerRoleLabel}: @{order.buyerUsername}
                    </div>
                  ):null}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:'auto',paddingTop:8}}>
                    <button type="button" onClick={()=>openChat(order)}>💬 Messaggi</button>
                    {isPending&&(
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={()=>updateOrderStatus(order._id,'ACCEPTED')}
                          style={{background:'#059669',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontWeight:700,cursor:isUpdating?'not-allowed':'pointer'}}
                        >
                          ✓ {t.accept}
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={()=>updateOrderStatus(order._id,'REJECTED')}
                          style={{background:'rgba(239,68,68,.12)',color:'#f87171',border:'1px solid #ef4444',borderRadius:8,padding:'7px 14px',fontWeight:700,cursor:isUpdating?'not-allowed':'pointer'}}
                        >
                          ✕ {t.decline}
                        </button>
                      </>
                    )}
                    {isAccepted&&(
                      <>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={()=>updateOrderStatus(order._id,'COMPLETED')}
                          style={{background:'#0284c7',color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontWeight:700,cursor:isUpdating?'not-allowed':'pointer'}}
                        >
                          ★ {t.statusCompleted}
                        </button>
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={()=>updateOrderStatus(order._id,'CANCELLED')}
                          style={{background:'transparent',color:'#94a3b8',border:'1px solid #475569',borderRadius:8,padding:'7px 14px',cursor:isUpdating?'not-allowed':'pointer'}}
                        >
                          {t.cancelOrder}
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    )}

    {/* Section: My Requests for Buyers (Issue #1683) */}
    {activeSection==='my_requests'&&(
      <section style={{margin:'20px 0'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:14}}>
          <h3 style={{margin:0}}>📤 {t.myRequests} ({myRequests.length})</h3>
          <button type="button" onClick={loadOrders} disabled={ordersLoading} style={{padding:'6px 12px',fontSize:13,cursor:'pointer'}}>
            🔄 {ordersLoading?t.loadingOrders:t.refreshOrders}
          </button>
        </div>
        {ordersLoading&&<p>{t.loadingOrders}</p>}
        {ordersError&&<p role="alert" style={{color:'#f87171',background:'rgba(239,68,68,.1)',padding:10,borderRadius:8}}>⚠️ {ordersError}</p>}
        {!ordersLoading&&myRequests.length===0&&(
          <div style={{padding:24,border:'1px dashed #555',borderRadius:14,textAlign:'center',background:'rgba(255,255,255,.02)'}}>
            <p style={{margin:'0 0 12px',opacity:.85}}>{t.noMyRequests}</p>
            <button type="button" onClick={()=>setActiveSection('browse')} style={{background:'#0284c7',color:'#fff',border:'none',padding:'8px 16px',borderRadius:10,fontWeight:700,cursor:'pointer'}}>
              🛒 {t.browseListings} →
            </button>
          </div>
        )}
        {!ordersLoading&&myRequests.length>0&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',gap:14}}>
            {myRequests.map(order=>{
              const isPending=order.status==='REQUESTED';
              const isAccepted=order.status==='ACCEPTED';
              const isRejected=order.status==='REJECTED';
              const isCompleted=order.status==='COMPLETED';
              const statusBadgeBg=isPending?'#fef3c7':isAccepted?'#d1fae5':isRejected?'#fee2e2':isCompleted?'#ede9fe':'#f1f5f9';
              const statusBadgeColor=isPending?'#92400e':isAccepted?'#065f46':isRejected?'#991b1b':isCompleted?'#5b21b6':'#475569';
              const statusLabel=isPending?`⏳ ${t.statusRequested}`:isAccepted?`✓ ${t.statusAccepted}`:isRejected?`✕ ${t.statusRejected}`:isCompleted?`★ ${t.statusCompleted}`:`⊘ ${t.statusCancelled}`;
              const isUpdating=updatingOrderId===order._id;
              return(
                <article key={order._id} style={{border:'1px solid rgba(127,127,127,.35)',borderRadius:14,padding:16,background:'rgba(255,255,255,.02)',display:'flex',flexDirection:'column',gap:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{padding:'3px 9px',borderRadius:999,background:statusBadgeBg,color:statusBadgeColor,fontWeight:700,fontSize:12}}>
                      {statusLabel}
                    </span>
                    <small style={{opacity:.65}}>#{String(order._id).slice(-6)}</small>
                  </div>
                  <h4 style={{margin:'4px 0 2px'}}>{order.snapshot?.title||order.listingId?.title||'Annuncio'}</h4>
                  <p style={{margin:0,fontSize:14}}>
                    <strong>{order.snapshot?.currency==='FREE'?t.free:order.snapshot?.currency==='BARTER'?t.barter:`${Number(order.snapshot?.price||0)*Number(order.quantity||1)} ${order.snapshot?.currency||''}`}</strong> · {t.requestQuantity}: {order.quantity}
                  </p>
                  {order.note?(
                    <div style={{background:'rgba(255,255,255,.05)',padding:10,borderRadius:8,fontSize:13,fontStyle:'italic',borderLeft:'3px solid #0284c7'}}>
                      💬 "{order.note}"
                    </div>
                  ):null}
                  {order.listingId?.ownerUsername?(
                    <div style={{fontSize:12,opacity:.75}}>
                      👤 {t.sellerRoleLabel}: @{order.listingId.ownerUsername}
                    </div>
                  ):null}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:'auto',paddingTop:8}}>
                    <button type="button" onClick={()=>openChat(order)}>💬 Messaggi</button>
                    {(isPending||isAccepted)&&(
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={()=>updateOrderStatus(order._id,'CANCELLED')}
                        style={{background:'rgba(239,68,68,.12)',color:'#f87171',border:'1px solid #ef4444',borderRadius:8,padding:'7px 14px',fontWeight:700,cursor:isUpdating?'not-allowed':'pointer'}}
                      >
                        {t.cancelOrder}
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    )}

    {/* Section: My Listings */}
    {activeSection==='my_listings'&&myListings.length>0&&(
      <section style={{margin:'20px 0',padding:16,border:'1px solid #0284c7',borderRadius:14}}>
        <h3>📦 {t.myListings} ({myListings.length})</h3>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(240px,100%),1fr))',gap:12}}>
          {myListings.map(m=><article key={m.id||m._id} style={{border:'1px solid #444',borderRadius:10,padding:12}}>
            <small>{m.category} · {m.status}</small>
            <h4 style={{margin:'4px 0'}}>{m.title}</h4>
            <p style={{margin:'4px 0',fontSize:13}}>{m.description}</p>
            <strong>{m.currency==='FREE'?t.free:m.currency==='BARTER'?t.barter:`${m.price} ${m.currency}`}</strong>
            <div style={{marginTop:8}}>
              <button type="button" onClick={()=>startEdit(m)}>✏️ {t.edit}</button>
            </div>
          </article>)}
        </div>
      </section>
    )}

    {/* Section: Browse Listings (Default) */}
    {activeSection==='browse'&&(
      <>
        {incomingOrders.some(o=>o.status==='REQUESTED')&&(
          <aside style={{background:'rgba(5,150,105,.12)',border:'1px solid #059669',borderRadius:12,padding:'12px 16px',margin:'14px 0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:10}}>
            <div>
              <strong>📥 {t.incomingRequests}:</strong> {incomingOrders.filter(o=>o.status==='REQUESTED').length} in attesa di risposta.
            </div>
            <button type="button" onClick={()=>setActiveSection('incoming_orders')} style={{background:'#059669',color:'#fff',border:'none',borderRadius:8,padding:'6px 14px',fontWeight:700,cursor:'pointer'}}>
              {t.viewIncomingRequests} →
            </button>
          </aside>
        )}

        <section style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
          <select aria-label={t.all} style={{flex:'1 1 190px'}} value={category} onChange={e=>setCategory(e.target.value)}>
            <option value="">{t.all}</option>
            {filterCategories.map(cat=><option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input style={{flex:'1 1 190px',minWidth:0}} placeholder={t.filter} value={location} onChange={e=>setLocation(e.target.value)}/>
          <button onClick={()=>load(1)}>{t.refresh}</button>
        </section>

        {category&&<div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(56,189,248,.12)',border:'1px solid rgba(56,189,248,.35)',borderRadius:12,margin:'12px 0'}}>
          <span style={{fontSize:13,color:'#38bdf8',fontWeight:700}}>🏷️ {t.activeCategoryFilter}: <strong>{category}</strong></span>
          <button type="button" onClick={()=>setCategory('')} style={{background:'transparent',border:'1px solid rgba(56,189,248,.3)',borderRadius:8,color:'#38bdf8',cursor:'pointer',fontSize:12,fontWeight:700,padding:'4px 8px'}}>✕ {t.clearFilter}</button>
        </div>}

        <section ref={demoSectionRef} tabIndex="-1" aria-labelledby="demo-sellers-title" style={{margin:'28px 0',padding:'clamp(14px,3vw,20px)',border:'1px solid #2f9e66',borderRadius:18,scrollMarginTop:20}}>
          <h3 id="demo-sellers-title">{t.demoTitle}</h3>
          <p>{t.demoNote}</p>
          <p style={{padding:10,border:'1px solid #b45309',borderRadius:10}}><strong>{t.demoWarning}</strong></p>
          <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center',marginBottom:16}}>
            <input style={{flex:'1 1 210px',minWidth:0}} aria-label={t.demoSearch} placeholder={t.demoSearch} value={demoQuery} onChange={e=>setDemoQuery(e.target.value)}/>
            <select style={{flex:'1 1 190px'}} aria-label={t.demoPayment} value={demoPayment} onChange={e=>setDemoPayment(e.target.value)}>
              <option value="">{t.demoAllPayments}</option>
              <option value="FREE">{t.free}</option>
              <option value="BARTER">{t.barter}</option>
              <option value="EUR">EUR</option>
              <option value="MYZ">MYZ</option>
            </select>
            <span aria-live="polite">{filteredDemos.length}/{DEMO_SELLERS.length}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(240px,100%),1fr))',gap:16}}>
            {filteredDemos.map(s=><article key={s.id} style={cardStyle}>
              <div aria-hidden="true" style={{fontSize:42,minHeight:70,display:'grid',placeItems:'center',borderRadius:12,background:'linear-gradient(135deg,rgba(47,158,102,.14),rgba(91,91,214,.14))'}}>{s.icon}</div>
              <small style={{fontWeight:700,color:'#2f9e66'}}>{t.demoBadge} · {s.category}</small>
              <h3 style={{margin:'4px 0'}}>{s.name}</h3>
              <p style={{margin:0}}>{s.location}</p>
              <p><strong>{t.demoOffer}:</strong> {s.offer}</p>
              <p><strong>{s.price==='FREE'?t.free:s.price==='BARTER'?t.barter:s.price}</strong> · {s.requests} {t.demoRequests}</p>
              <p><strong>{t.demoAvailability}:</strong> {s.availability}</p>
              <button onClick={()=>openDemo(s)}>{t.demoDetails}</button>
            </article>)}
          </div>
          {!filteredDemos.length&&<p>{t.noDemoMatches}</p>}
        </section>

        {loading&&<p>{t.loading}</p>}
        {error&&<p>{error}</p>}
        {!loading&&!error&&!listings.length&&<section><h3>{t.empty}</h3><p>{t.first}</p></section>}

        <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(240px,100%),1fr))',gap:16}}>
          {listings.map(l=>{
            const isMine=myListings.some(m=>(m.id||m._id)===(l.id||l._id));
            return <article key={l.id||l._id} style={{border:'1px solid #555',padding:16,minWidth:0}}>
              <small>{l.category}</small>
              <h3>{l.title}</h3>
              {l.description&&<p>{l.description}</p>}
              <strong>{l.currency==='FREE'?t.free:l.currency==='BARTER'?t.barter:`${l.price} ${l.currency}`}</strong>
              <div style={{marginTop:8,display:'flex',gap:8}}>
                {isMine?<button type="button" onClick={()=>startEdit(l)}>✏️ {t.edit}</button>:<button onClick={()=>openRequestDialog(l)}>{t.request}</button>}
              </div>
            </article>;
          })}
        </section>

        {hasMore&&<div style={{textAlign:'center',margin:'24px 0'}}>
          <button type="button" onClick={loadMore} disabled={loadingMore} style={{padding:'10px 22px',fontWeight:700,borderRadius:10,cursor:loadingMore?'not-allowed':'pointer'}}>
            {loadingMore?t.loadingMore:`⬇️ ${t.loadMore}`}
          </button>
        </div>}
      </>
    )}

    {/* Accessible Request Listing Modal (Issues #1680 & #1683) */}
    {activeRequestListing&&<div role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closeRequestDialog()}} style={{position:'fixed',inset:0,zIndex:1000,display:'grid',placeItems:'center',padding:12,background:'rgba(0,0,0,.68)'}}>
      <section ref={requestDialogRef} tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="request-dialog-title" style={{width:'min(640px,calc(100vw - 24px))',maxHeight:'calc(100vh - 24px)',overflowY:'auto',padding:'clamp(16px,4vw,24px)',border:'2px solid #2f9e66',borderRadius:18,background:'Canvas',color:'CanvasText',boxSizing:'border-box',boxShadow:'0 18px 60px rgba(0,0,0,.35)'}}>
        <div style={{position:'sticky',top:-1,zIndex:1,display:'flex',justifyContent:'flex-end',background:'Canvas',paddingBottom:8}}>
          <button type="button" onClick={closeRequestDialog} aria-label={t.close}>✕ {t.close}</button>
        </div>

        {confirmedOrder?(
          /* Confirmed Order State (Issue #1683 requirement 2) */
          <div style={{textAlign:'center',padding:'8px 0'}}>
            <div style={{fontSize:48,color:'#10b981',lineHeight:1}} aria-hidden="true">✓</div>
            <h3 style={{margin:'8px 0 14px',color:'#10b981'}}>{t.requestSuccess}</h3>
            <div style={{border:'1px solid #059669',borderRadius:12,padding:14,background:'rgba(5,150,105,.08)',textAlign:'left',margin:'0 0 18px',display:'grid',gap:6}}>
              <div><strong>{t.orderReference}:</strong> <code>#{confirmedOrder._id||confirmedOrder.id}</code></div>
              <div><strong>{t.formTitle}:</strong> {confirmedOrder.snapshot?.title||activeRequestListing.title}</div>
              <div><strong>{t.requestQuantity}:</strong> {confirmedOrder.quantity}</div>
              <div><strong>{t.price}:</strong> {confirmedOrder.snapshot?.currency==='FREE'?t.free:confirmedOrder.snapshot?.currency==='BARTER'?t.barter:`${confirmedOrder.snapshot?.price||0} ${confirmedOrder.snapshot?.currency||''}`}</div>
              <div><strong>Stato:</strong> <span style={{padding:'2px 8px',borderRadius:999,background:'#fef3c7',color:'#92400e',fontWeight:700,fontSize:12}}>⏳ {t.statusRequested}</span></div>
              {confirmedOrder.note?<div style={{marginTop:4,fontStyle:'italic',opacity:.9}}>💬 "{confirmedOrder.note}"</div>:null}
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center',flexWrap:'wrap'}}>
              <button
                type="button"
                onClick={()=>{closeRequestDialog();setActiveSection('my_requests');}}
                style={{background:'#0284c7',color:'#fff',fontWeight:700,padding:'10px 18px',borderRadius:10,border:'none',cursor:'pointer'}}
              >
                📋 {t.viewMyRequests} →
              </button>
              <button
                type="button"
                onClick={closeRequestDialog}
                style={{padding:'10px 18px',borderRadius:10,cursor:'pointer'}}
              >
                {t.close}
              </button>
            </div>
          </div>
        ):(
          /* Request Form / Login Prompt State */
          <>
            <small style={{fontWeight:700,color:'#2f9e66'}}>{activeRequestListing.category}</small>
            <h2 id="request-dialog-title" style={{margin:'6px 0 10px'}}>{activeRequestListing.title}</h2>
            <p style={{margin:'0 0 12px'}}>
              <strong>{activeRequestListing.currency==='FREE'?t.free:activeRequestListing.currency==='BARTER'?t.barter:`${activeRequestListing.price} ${activeRequestListing.currency}`}</strong>
              {activeRequestListing.location?` · 📍 ${activeRequestListing.location}`:''}
              {activeRequestListing.ownerUsername?` · 👤 ${activeRequestListing.ownerUsername}`:''}
            </p>

            {!localStorage.getItem('myzubster-token')?(
              /* Unauthenticated user login prompt with returnTo (Issue #1683 requirement 1) */
              <div style={{padding:16,border:'1px solid #38bdf8',borderRadius:12,background:'rgba(56,189,248,.08)'}}>
                <p style={{margin:'0 0 14px'}}>{t.requestLoginPrompt}</p>
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  <a
                    href={`/social-login?returnTo=${encodeURIComponent(window.location.pathname+window.location.search+window.location.hash)}`}
                    style={{display:'inline-block',padding:'10px 18px',background:'#0284c7',color:'#fff',borderRadius:10,textDecoration:'none',fontWeight:700}}
                  >
                    👤 {t.loginToRequest}
                  </a>
                  <button type="button" onClick={closeRequestDialog}>{t.cancel}</button>
                </div>
              </div>
            ):(
              /* Authenticated user request form */
              <form onSubmit={submitOrderRequest} style={{display:'flex',flexDirection:'column',gap:14}}>
                <div>
                  <label htmlFor="request-qty-input" style={{display:'block',fontWeight:700,marginBottom:4}}>{t.requestQuantity}:</label>
                  <input
                    id="request-qty-input"
                    type="number"
                    min="1"
                    max={activeRequestListing.stock||100}
                    value={requestQuantity}
                    onChange={e=>setRequestQuantity(Math.max(1,Math.min(activeRequestListing.stock||100,Number(e.target.value)||1)))}
                    style={{padding:8,borderRadius:8,border:'1px solid #666',width:90}}
                  />
                  {activeRequestListing.stock?<small style={{marginLeft:8,opacity:.8}}>(Max: {activeRequestListing.stock})</small>:null}
                </div>
                <div>
                  <label htmlFor="request-note-input" style={{display:'block',fontWeight:700,marginBottom:4}}>{t.desc}:</label>
                  <textarea
                    id="request-note-input"
                    rows="3"
                    placeholder={t.requestNotePlaceholder}
                    value={requestNote}
                    onChange={e=>setRequestNote(e.target.value)}
                    style={{width:'100%',padding:10,borderRadius:8,border:'1px solid #666',boxSizing:'border-box',fontFamily:'inherit'}}
                  />
                </div>
                {requestError&&<p role="alert" style={{color:'#f87171',background:'rgba(239,68,68,.12)',padding:10,borderRadius:8,margin:0}}><strong>⚠️ {requestError}</strong></p>}
                <div style={{display:'flex',gap:10,marginTop:6}}>
                  <button type="submit" disabled={requestSubmitting} style={{fontWeight:700}}>
                    {requestSubmitting?t.requestSending:t.requestSend}
                  </button>
                  <button type="button" onClick={closeRequestDialog}>{t.cancel}</button>
                </div>
              </form>
            )}
          </>
        )}
      </section>
    </div>}

    {selectedDemo&&<div role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closeDemo()}} style={{position:'fixed',inset:0,zIndex:1000,display:'grid',placeItems:'center',padding:12,background:'rgba(0,0,0,.68)'}}>
      <section ref={demoDialogRef} tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="demo-detail-title" aria-describedby="demo-detail-description" style={{width:'min(720px,calc(100vw - 24px))',maxHeight:'calc(100vh - 24px)',overflowY:'auto',padding:'clamp(16px,4vw,24px)',border:'2px solid #5b5bd6',borderRadius:18,background:'Canvas',color:'CanvasText',boxSizing:'border-box',boxShadow:'0 18px 60px rgba(0,0,0,.35)'}}>
        <div style={{position:'sticky',top:-1,zIndex:1,display:'flex',justifyContent:'flex-end',background:'Canvas',paddingBottom:8}}>
          <button onClick={closeDemo} aria-label={t.closeDemo}>✕ {t.close}</button>
        </div>
        {!DEMO_IMAGES[selectedDemo.id]&&<div style={{fontSize:58}} aria-hidden="true">{selectedDemo.icon}</div>}
        <small>{t.demoBadge} · {selectedDemo.category}</small>
        <h2 id="demo-detail-title">{selectedDemo.name}</h2>
        {DEMO_IMAGES[selectedDemo.id]&&<img src={DEMO_IMAGES[selectedDemo.id]} alt={selectedDemo.offer} loading="lazy" decoding="async" style={{display:'block',width:'100%',maxHeight:'420px',objectFit:'cover',borderRadius:14,margin:'10px 0 16px'}}/>}
        <p id="demo-detail-description">{selectedDemo.description}</p>
        <p><strong>{selectedDemo.offer}</strong></p>
        <p>{selectedDemo.location} · {selectedDemo.price==='FREE'?t.free:selectedDemo.price==='BARTER'?t.barter:selectedDemo.price} · {selectedDemo.availability}</p>
        <dl>{selectedDemo.details.map(([label,value])=><div key={label} style={{display:'grid',gridTemplateColumns:'minmax(90px,140px) minmax(0,1fr)',gap:10,padding:'6px 0'}}><dt><strong>{label}</strong></dt><dd style={{margin:0,overflowWrap:'anywhere'}}>{value}</dd></div>)}</dl>
        <p style={{padding:10,border:'1px solid #b45309',borderRadius:10}}><strong>{t.demoWarning}</strong></p>
        {demoFlow==='idle'&&<button onClick={startDemoRequest}>{t.demoRequest}</button>}
        {demoFlow==='review'&&<div>
          <h3>{t.demoReview}</h3>
          <p>{selectedDemo.offer} · {selectedDemo.price==='FREE'?t.free:selectedDemo.price==='BARTER'?t.barter:selectedDemo.price}</p>
          <p>{t.demoLocalReview}</p>
          <button onClick={confirmDemoRequest}>{t.demoConfirm}</button>
        </div>}
        {demoFlow==='confirmed'&&<p role="status" style={{padding:12,border:'1px solid #2f9e66',borderRadius:10}}><strong>✓ {t.demoConfirmed}</strong></p>}
        <div style={{marginTop:18}}><button onClick={closeDemo}>← {t.demoBack}</button></div>
      </section>
    </div>}

    <details style={{marginTop:28,padding:16,border:'1px solid #444',borderRadius:12}}>
      <summary style={{cursor:'pointer'}}>{t.wallet}</summary>
      <WalletHubPanel compact/>
    </details>

    {!sellerState?.active&&<section style={{marginTop:28,padding:20,borderTop:'1px solid #444',textAlign:'center'}}>
      <h3>{t.seller}</h3>
      <p>{t.buyer}</p>
      <button onClick={becomeSeller}>{sellerCta}</button>
    </section>}
  </main>;
}

export{
  categories as MARKETPLACE_CATEGORIES,
  DEMO_SELLERS,
  C as MARKETPLACE_COPY,
  demoPaymentMode,
  filterDemoSellers,
  isDemoDeepLink,
  getInitialCategory,
  resolveFilterCategories
};
export default MarketplacePage;

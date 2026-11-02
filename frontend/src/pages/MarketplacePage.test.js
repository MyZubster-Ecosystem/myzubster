import React from 'react';
import ReactDOMServer from 'react-dom/server';
import MarketplacePage, {
  DEMO_SELLERS,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_COPY,
  demoPaymentMode,
  filterDemoSellers,
  isDemoDeepLink,
  getInitialCategory,
  resolveFilterCategories
} from './MarketplacePage';

describe('Marketplace Demo v2 & Category Filter Deep Links (PR #1627)',()=>{
  test('provides at least one demo seller for every category',()=>{const covered=new Set(DEMO_SELLERS.map(s=>s.category));expect(MARKETPLACE_CATEGORIES.filter(c=>!covered.has(c))).toEqual([])});
  test('uses valid categories and unique demo ids',()=>{const allowed=new Set(MARKETPLACE_CATEGORIES),ids=DEMO_SELLERS.map(s=>s.id);expect(DEMO_SELLERS.every(s=>allowed.has(s.category))).toBe(true);expect(new Set(ids).size).toBe(ids.length)});
  test('every demo has a visual, detail content and availability',()=>{expect(DEMO_SELLERS.every(s=>s.icon&&s.description&&s.availability&&Array.isArray(s.details)&&s.details.length)).toBe(true)});
  test('filters demos by category, location, text and payment mode',()=>{expect(filterDemoSellers(DEMO_SELLERS,{category:'pet_adoption'}).map(s=>s.id)).toContain('demo-pet-adoption');expect(filterDemoSellers(DEMO_SELLERS,{location:'Cesena'}).every(s=>s.location.includes('Cesena'))).toBe(true);expect(filterDemoSellers(DEMO_SELLERS,{query:'volontario'}).map(s=>s.id)).toContain('demo-volunteering');expect(filterDemoSellers(DEMO_SELLERS,{payment:'BARTER'}).every(s=>demoPaymentMode(s.price)==='BARTER')).toBe(true)});
  test('specialized community categories expose purpose-specific fields',()=>{for(const category of['volunteering','pet_adoption','pet_lost_found','pet_services']){const demo=DEMO_SELLERS.find(s=>s.category===category);expect(demo.details.length).toBeGreaterThanOrEqual(3)}});
  test('recognizes only the explicit demo deep link',()=>{expect(isDemoDeepLink('?demo=1&utm_source=facebook')).toBe(true);expect(isDemoDeepLink('?demo=0')).toBe(false);expect(isDemoDeepLink('?utm_source=facebook')).toBe(false)});
  test('initializes category from category query parameter on deep-link load',()=>{
    expect(getInitialCategory('?category=digital_services')).toBe('digital_services');
    expect(getInitialCategory('?category=services&action=new')).toBe('services');
    expect(getInitialCategory('?utm_source=homepage')).toBe('');
    expect(getInitialCategory('')).toBe('');
  });
  test('ensures deep-linked category is included in selectable filter options',()=>{
    const categoriesWithSelected=resolveFilterCategories('digital_services',['custom_service'],['services']);
    expect(categoriesWithSelected).toContain('digital_services');
    expect(categoriesWithSelected).toContain('custom_service');
    expect(categoriesWithSelected).toContain('services');
  });
  test('keeps Spanish, French and German UI copy localized instead of falling back to English',()=>{const keys=['title','intro','seller','activate','active','publish','close','desc','place','price','send','all','filter','refresh','loading','empty','first','request','free','barter','login','published','why','buyer','success','wallet','formTitle','myListings','edit','editListing','saveChanges','updated','cancel','activeCategoryFilter','clearFilter','loadMore','loadingMore','demoNote','demoOffer','demoRequests','demoSearch','demoPayment','demoAllPayments','demoDetails','demoAvailability','demoRequest','demoWarning','demoReview','demoConfirm','demoConfirmed','demoBack','demoLocalReview','noDemoMatches','closeDemo'];for(const lang of['es','fr','de'])for(const key of keys){expect(typeof MARKETPLACE_COPY[lang][key]).toBe('string');expect(MARKETPLACE_COPY[lang][key].trim()).not.toBe('');if(lang==='fr'&&key==='desc')expect(MARKETPLACE_COPY[lang][key]).toBe('Description');else expect(MARKETPLACE_COPY[lang][key]).not.toBe(MARKETPLACE_COPY.en[key])}});
  test('keeps localized benefit lists complete',()=>{for(const lang of['it','es','fr','de'])expect(MARKETPLACE_COPY[lang].benefits).toHaveLength(MARKETPLACE_COPY.en.benefits.length)});
  test('localizes free, barter, pagination and active filter across all 5 languages without Italian fallbacks',()=>{
    expect(MARKETPLACE_COPY.it.free).toBe('Gratis');
    expect(MARKETPLACE_COPY.it.barter).toBe('Baratto');
    expect(MARKETPLACE_COPY.it.loadMore).toBe('Carica altri annunci');
    expect(MARKETPLACE_COPY.it.activeCategoryFilter).toBe('Filtro categoria attivo');

    expect(MARKETPLACE_COPY.en.free).toBe('Free');
    expect(MARKETPLACE_COPY.en.barter).toBe('Barter');
    expect(MARKETPLACE_COPY.en.loadMore).toBe('Load older listings');
    expect(MARKETPLACE_COPY.en.activeCategoryFilter).toBe('Active category filter');

    expect(MARKETPLACE_COPY.es.free).toBe('Gratis');
    expect(MARKETPLACE_COPY.es.barter).toBe('Trueque');
    expect(MARKETPLACE_COPY.es.loadMore).toBe('Cargar más anuncios');
    expect(MARKETPLACE_COPY.es.activeCategoryFilter).toBe('Filtro de categoría activo');

    expect(MARKETPLACE_COPY.fr.free).toBe('Gratuit');
    expect(MARKETPLACE_COPY.fr.barter).toBe('Troc');
    expect(MARKETPLACE_COPY.fr.loadMore).toBe('Charger plus d’annonces');
    expect(MARKETPLACE_COPY.fr.activeCategoryFilter).toBe('Filtre de catégorie actif');

    expect(MARKETPLACE_COPY.de.free).toBe('Kostenlos');
    expect(MARKETPLACE_COPY.de.barter).toBe('Tausch');
    expect(MARKETPLACE_COPY.de.loadMore).toBe('Weitere Anzeigen laden');
    expect(MARKETPLACE_COPY.de.activeCategoryFilter).toBe('Aktiver Kategoriefilter');
  });
});

describe('Marketplace Request / Contact Seller Button (Issue #1680)', () => {
  test('localizes request button and request modal copy across all 5 languages', () => {
    const requiredKeys = [
      'request',
      'requestListingModal',
      'requestNotePlaceholder',
      'requestQuantity',
      'requestSend',
      'requestSending',
      'requestSuccess',
      'requestLoginPrompt',
      'loginToRequest',
      'selfRequestError'
    ];

    for (const lang of ['en', 'it', 'es', 'fr', 'de']) {
      for (const key of requiredKeys) {
        expect(typeof MARKETPLACE_COPY[lang][key]).toBe('string');
        expect(MARKETPLACE_COPY[lang][key].trim().length).toBeGreaterThan(0);
      }
    }

    // Verify language-specific translations
    expect(MARKETPLACE_COPY.it.request).toBe('Richiedi');
    expect(MARKETPLACE_COPY.it.requestSend).toBe('Invia richiesta');
    expect(MARKETPLACE_COPY.it.selfRequestError).toBe('Non puoi richiedere il tuo stesso annuncio.');

    expect(MARKETPLACE_COPY.en.request).toBe('Request');
    expect(MARKETPLACE_COPY.en.requestSend).toBe('Send request');
    expect(MARKETPLACE_COPY.en.selfRequestError).toBe('You cannot request your own listing.');

    expect(MARKETPLACE_COPY.es.request).toBe('Solicitar');
    expect(MARKETPLACE_COPY.es.requestSend).toBe('Enviar solicitud');

    expect(MARKETPLACE_COPY.fr.request).toBe('Demander');
    expect(MARKETPLACE_COPY.fr.requestSend).toBe('Envoyer la demande');

    expect(MARKETPLACE_COPY.de.request).toBe('Anfragen');
    expect(MARKETPLACE_COPY.de.requestSend).toBe('Anfrage senden');
  });
});

describe('Marketplace Order Views & Request Lifecycle (Issue #1683)', () => {
  const orderViewKeys = [
    'incomingRequests',
    'myRequests',
    'browseListings',
    'noIncomingRequests',
    'noMyRequests',
    'loadingOrders',
    'accept',
    'decline',
    'cancelOrder',
    'orderAccepted',
    'orderDeclined',
    'orderCancelled',
    'orderReference',
    'statusRequested',
    'statusAccepted',
    'statusRejected',
    'statusCompleted',
    'statusCancelled',
    'duplicateRequestError',
    'viewMyRequests',
    'viewIncomingRequests',
    'buyerRoleLabel',
    'sellerRoleLabel',
    'refreshOrders'
  ];

  test('localizes all order and request view copy across all 5 languages', () => {
    for (const lang of ['en', 'it', 'es', 'fr', 'de']) {
      for (const key of orderViewKeys) {
        expect(typeof MARKETPLACE_COPY[lang][key]).toBe('string');
        expect(MARKETPLACE_COPY[lang][key].trim().length).toBeGreaterThan(0);
      }
    }

    // Italian
    expect(MARKETPLACE_COPY.it.incomingRequests).toBe('Richieste ricevute');
    expect(MARKETPLACE_COPY.it.myRequests).toBe('Le mie richieste');
    expect(MARKETPLACE_COPY.it.browseListings).toBe('Catalogo annunci');
    expect(MARKETPLACE_COPY.it.accept).toBe('Accetta');
    expect(MARKETPLACE_COPY.it.decline).toBe('Rifiuta');
    expect(MARKETPLACE_COPY.it.cancelOrder).toBe('Annulla richiesta');
    expect(MARKETPLACE_COPY.it.statusRequested).toBe('In attesa di approvazione');
    expect(MARKETPLACE_COPY.it.statusAccepted).toBe('Accettata');
    expect(MARKETPLACE_COPY.it.duplicateRequestError).toBe('Hai già una richiesta aperta per questo annuncio.');

    // English
    expect(MARKETPLACE_COPY.en.incomingRequests).toBe('Incoming requests');
    expect(MARKETPLACE_COPY.en.myRequests).toBe('My requests');
    expect(MARKETPLACE_COPY.en.browseListings).toBe('Browse listings');
    expect(MARKETPLACE_COPY.en.accept).toBe('Accept');
    expect(MARKETPLACE_COPY.en.decline).toBe('Decline');

    // Spanish
    expect(MARKETPLACE_COPY.es.incomingRequests).toBe('Solicitudes recibidas');
    expect(MARKETPLACE_COPY.es.myRequests).toBe('Mis solicitudes');

    // French
    expect(MARKETPLACE_COPY.fr.incomingRequests).toBe('Demandes reçues');
    expect(MARKETPLACE_COPY.fr.myRequests).toBe('Mes demandes');

    // German
    expect(MARKETPLACE_COPY.de.incomingRequests).toBe('Eingehende Anfragen');
    expect(MARKETPLACE_COPY.de.myRequests).toBe('Meine Anfragen');
  });

  test('renders navigation tabs and browse catalog for unauthenticated visitor', () => {
    const originalStorage = global.localStorage;
    try {
      localStorage.setItem('myzubster-language', 'it');
      localStorage.removeItem('myzubster-token');
      const html = ReactDOMServer.renderToString(<MarketplacePage />);
      expect(html).toContain('MYZUBSTER MARKETPLACE');
      expect(html).toContain('Catalogo annunci');
      expect(html).toContain('🏠 Home');
      // Buyer and seller tabs are gated for authenticated users
      expect(html).not.toContain('Richieste ricevute');
      expect(html).not.toContain('Le mie richieste');
    } finally {
      global.localStorage = originalStorage;
    }
  });

  test('renders authenticated navigation with buyer and seller tabs', () => {
    const originalStorage = global.localStorage;
    try {
      localStorage.setItem('myzubster-language', 'it');
      localStorage.setItem('myzubster-token', 'mock-token-xyz');
      const html = ReactDOMServer.renderToString(<MarketplacePage />);
      expect(html).toContain('Catalogo annunci');
      expect(html).toContain('Richieste ricevute');
      expect(html).toContain('Le mie richieste');
    } finally {
      global.localStorage = originalStorage;
    }
  });

  test('renders English navigation labels when English is selected', () => {
    const originalStorage = global.localStorage;
    try {
      localStorage.setItem('myzubster-language', 'en');
      localStorage.setItem('myzubster-token', 'mock-token-xyz');
      const html = ReactDOMServer.renderToString(<MarketplacePage />);
      expect(html).toContain('Browse listings');
      expect(html).toContain('Incoming requests');
      expect(html).toContain('My requests');
    } finally {
      global.localStorage = originalStorage;
    }
  });
});

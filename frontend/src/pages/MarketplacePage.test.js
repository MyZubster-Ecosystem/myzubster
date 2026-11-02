import React from 'react';
import ReactDOMServer from 'react-dom/server';
import MarketplacePage, {DEMO_SELLERS,MARKETPLACE_CATEGORIES,MARKETPLACE_COPY,demoPaymentMode,filterDemoSellers,isDemoDeepLink,getInitialCategory,resolveFilterCategories,getOrderStatusConfig}from'./MarketplacePage';

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

  test('localizes unread message badges and inbox copy across all 5 languages without leaks', () => {
    const unreadKeys = [
      'ordersTitle',
      'refreshOrders',
      'receivedRequests',
      'myRequests',
      'noOrders',
      'messages',
      'unreadBadge',
      'unreadNotice',
      'conversationTitle',
      'refreshMessages',
      'loadingMessages',
      'noMessages',
      'writeMessage',
      'sendMessage',
      'sendingMessage',
      'conversationClosed',
      'acceptOrder',
      'rejectOrder',
      'cancelOrder'
    ];

    for (const lang of ['it', 'en', 'es', 'fr', 'de']) {
      for (const key of unreadKeys) {
        expect(typeof MARKETPLACE_COPY[lang][key]).toBe('string');
        expect(MARKETPLACE_COPY[lang][key].trim().length).toBeGreaterThan(0);
      }
    }

    // Explicit check on Italian translations
    expect(MARKETPLACE_COPY.it.ordersTitle).toBe('Richieste Marketplace');
    expect(MARKETPLACE_COPY.it.messages).toBe('Messaggi');
    expect(MARKETPLACE_COPY.it.unreadBadge).toBe('non letti');
    expect(MARKETPLACE_COPY.it.conversationTitle).toBe('Conversazione');

    // Explicit check on English translations
    expect(MARKETPLACE_COPY.en.ordersTitle).toBe('Marketplace requests');
    expect(MARKETPLACE_COPY.en.messages).toBe('Messages');
    expect(MARKETPLACE_COPY.en.unreadBadge).toBe('unread');
    expect(MARKETPLACE_COPY.en.conversationTitle).toBe('Conversation');

    // Explicit check on Spanish translations
    expect(MARKETPLACE_COPY.es.ordersTitle).toBe('Solicitudes del Marketplace');
    expect(MARKETPLACE_COPY.es.messages).toBe('Mensajes');
    expect(MARKETPLACE_COPY.es.unreadBadge).toBe('no leídos');

    // Explicit check on French translations
    expect(MARKETPLACE_COPY.fr.ordersTitle).toBe('Demandes du Marketplace');
    expect(MARKETPLACE_COPY.fr.messages).toBe('Messages');
    expect(MARKETPLACE_COPY.fr.unreadBadge).toBe('non lus');

    // Explicit check on German translations
    expect(MARKETPLACE_COPY.de.ordersTitle).toBe('Marketplace-Anfragen');
    expect(MARKETPLACE_COPY.de.messages).toBe('Nachrichten');
    expect(MARKETPLACE_COPY.de.unreadBadge).toBe('ungelesen');
  });

  test('MarketplacePage renders authenticated orders section with unread notifications container when token is present', () => {
    const originalStorage = global.localStorage;
    try {
      localStorage.setItem('myzubster-token', 'mock-valid-token');
      localStorage.setItem('myzubster-language', 'it');
      const html = ReactDOMServer.renderToString(<MarketplacePage />);
      expect(html).toContain('id="marketplace-orders"');
      expect(html).toContain('Richieste Marketplace');
      expect(html).toContain('Aggiorna richieste');
      expect(html).toContain('Richieste ricevute');
      expect(html).toContain('Le mie richieste');
    } finally {
      global.localStorage = originalStorage;
    }
  });

  test('MarketplacePage does not render orders section when unauthenticated', () => {
    const originalStorage = global.localStorage;
    try {
      localStorage.removeItem('myzubster-token');
      const html = ReactDOMServer.renderToString(<MarketplacePage />);
      expect(html).not.toContain('id="marketplace-orders"');
    } finally {
      global.localStorage = originalStorage;
    }
  });

  test('getOrderStatusConfig maps each order status to accessible human-readable labels, colors and icons (Issue #1687)', () => {
    const it = MARKETPLACE_COPY.it;
    const req = getOrderStatusConfig('REQUESTED', it);
    expect(req.label).toBe('In attesa di approvazione');
    expect(req.icon).toBe('⏳');
    expect(req.color).toBeTruthy();

    const acc = getOrderStatusConfig('ACCEPTED', it);
    expect(acc.label).toBe('Richiesta accettata');
    expect(acc.icon).toBe('🤝');

    const comp = getOrderStatusConfig('COMPLETED', it);
    expect(comp.label).toBe('Scambio completato');
    expect(comp.icon).toBe('✓');

    const rej = getOrderStatusConfig('REJECTED', it);
    expect(rej.label).toBe('Richiesta rifiutata');
    expect(rej.icon).toBe('✕');

    const can = getOrderStatusConfig('CANCELLED', it);
    expect(can.label).toBe('Richiesta annullata');
    expect(can.icon).toBe('🚫');
  });

  test('localizes order completion, confirmation prompts and contextual guidance across all 5 languages (Issue #1687)', () => {
    const uxKeys = [
      'statusRequested',
      'statusAccepted',
      'statusCompleted',
      'statusRejected',
      'statusCancelled',
      'completeOrder',
      'confirmRejectPrompt',
      'confirmCancelPrompt',
      'confirmCompletePrompt',
      'acceptedSellerGuideTitle',
      'acceptedSellerGuideDesc',
      'acceptedBuyerGuideTitle',
      'acceptedBuyerGuideDesc',
      'directExchangeNoticeTitle',
      'directExchangeNoticeDesc',
      'requestStatusLabel'
    ];

    for (const lang of ['it', 'en', 'es', 'fr', 'de']) {
      for (const key of uxKeys) {
        expect(typeof MARKETPLACE_COPY[lang][key]).toBe('string');
        expect(MARKETPLACE_COPY[lang][key].trim().length).toBeGreaterThan(0);
      }
    }

    // Italian copy checks
    expect(MARKETPLACE_COPY.it.completeOrder).toBe('Completa scambio');
    expect(MARKETPLACE_COPY.it.directExchangeNoticeTitle).toBe('Accordi diretti tra utenti');
    expect(MARKETPLACE_COPY.it.confirmRejectPrompt).toContain('rifiutare');
    expect(MARKETPLACE_COPY.it.confirmCancelPrompt).toContain('annullare');

    // English copy checks
    expect(MARKETPLACE_COPY.en.completeOrder).toBe('Complete exchange');
    expect(MARKETPLACE_COPY.en.directExchangeNoticeTitle).toBe('Direct community exchanges');
    expect(MARKETPLACE_COPY.en.confirmRejectPrompt).toContain('decline');
    expect(MARKETPLACE_COPY.en.confirmCancelPrompt).toContain('cancel');
  });

  test('MarketplacePage orders section renders direct exchange notice for transparency', () => {
    const originalStorage = global.localStorage;
    try {
      localStorage.setItem('myzubster-token', 'mock-valid-token');
      localStorage.setItem('myzubster-language', 'it');
      const html = ReactDOMServer.renderToString(<MarketplacePage />);
      expect(html).toContain('Accordi diretti tra utenti');
      expect(html).toContain('Checkout ed escrow automatici non sono attivi in anteprima');
    } finally {
      global.localStorage = originalStorage;
    }
  });
});

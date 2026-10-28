import{DEMO_SELLERS,MARKETPLACE_CATEGORIES,MARKETPLACE_COPY,demoPaymentMode,filterDemoSellers,isDemoDeepLink,getInitialCategory,resolveFilterCategories}from'./MarketplacePage';

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

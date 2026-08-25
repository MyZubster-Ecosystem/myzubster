const DEFAULT_MARKETPLACES = [
  { id: 'amazon-it', name: 'Amazon Italia', buildUrl: q => `https://www.amazon.it/s?k=${encodeURIComponent(q)}` },
  { id: 'ebay-it', name: 'eBay Italia', buildUrl: q => `https://www.ebay.it/sch/i.html?_nkw=${encodeURIComponent(q)}` },
  { id: 'aliexpress', name: 'AliExpress', buildUrl: q => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}` },
  { id: 'mouser-it', name: 'Mouser Italia', buildUrl: q => `https://www.mouser.it/c/?q=${encodeURIComponent(q)}` },
  { id: 'digikey-it', name: 'DigiKey Italia', buildUrl: q => `https://www.digikey.it/it/products/result?s=N4IgTCBcDaIKoHsCmBLA9gOwM4GsCmANCALoC%2BQA&q=${encodeURIComponent(q)}` }
];

const GENERAL_SEARCH = [
  { id: 'google', name: 'Google', buildUrl: q => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  { id: 'bing', name: 'Bing', buildUrl: q => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
  { id: 'duckduckgo', name: 'DuckDuckGo', buildUrl: q => `https://duckduckgo.com/?q=${encodeURIComponent(q)}` }
];

function clean(value, max = 240) {
  return String(value || '').trim().slice(0, max);
}

function detectBuildType(input) {
  const text = clean(input, 1000).toLowerCase();
  if (/monopattino|scooter|e-scooter/.test(text)) return 'electric_scooter';
  if (/robot|rover|braccio robot|robotico/.test(text)) return 'robot';
  return 'generic';
}

function component(id, name, purpose, searchQuery, compatibility, safety = null) {
  return { id, name, purpose, search_query: searchQuery, compatibility, safety };
}

function robotPlan(goal) {
  return {
    type: 'robot',
    title: 'Robot mobile modulare',
    goal,
    architecture: [
      'controllore → driver motori → motori/attuatori',
      'batteria → protezione/alimentazione → elettronica',
      'sensori → controllore → logica/autonomia'
    ],
    components: [
      component('controller', 'Controller', 'Logica e controllo', 'ESP32 development board robot', 'Verificare tensione I/O, numero GPIO e interfacce richieste.'),
      component('motor-driver', 'Driver motori', 'Pilotare i motori senza sovraccaricare il controller', 'dual motor driver robot 6V 12V', 'Corrente continua e di picco del driver devono superare quelle dei motori.'),
      component('motors', 'Motori con riduttore', 'Movimento', 'DC gear motor encoder robot 12V', 'Tensione nominale coerente con alimentazione; preferire encoder se serve odometria.'),
      component('battery', 'Batteria protetta', 'Alimentazione', '12V battery pack protected robot', 'Tensione compatibile con motori/driver; dimensionare capacità e corrente.', 'Usare pacchi protetti/certificati; evitare assemblaggio celle litio senza competenza specifica.'),
      component('regulator', 'Convertitore DC-DC', 'Alimentazione stabile elettronica', 'buck converter 12V 5V 3A', 'Ingresso sopra la tensione batteria massima; uscita e corrente adatte al controller.'),
      component('sensors', 'Sensori', 'Percezione ambiente', 'robot ultrasonic ToF IMU sensor kit', 'Scegliere sensori compatibili con I2C/UART/GPIO disponibili.'),
      component('chassis', 'Telaio + ruote', 'Struttura', 'robot car chassis 2wd 4wd metal', 'Portata meccanica sufficiente per batteria, elettronica e carico.'),
      component('wiring', 'Cablaggio, fusibile e connettori', 'Distribuzione elettrica sicura', 'inline fuse connector wire kit robot', 'Sezione cavi e fusibile adeguati alla corrente massima.', 'Proteggere sempre la linea batteria con fusibile appropriato.')
    ],
    steps: [
      'Definire massa, velocità, autonomia, terreno e carico utile.',
      'Scegliere motori e rapporto di riduzione, poi dimensionare driver e batteria.',
      'Assemblare telaio e trasmissione prima dell’elettronica.',
      'Verificare alimentazioni a banco con fusibile e limitazione di corrente.',
      'Collegare controller, driver e sensori, quindi testare un sottosistema alla volta.',
      'Aggiungere arresto sicuro, gestione errori e test controllati prima dell’uso autonomo.'
    ],
    checks: ['corrente di stallo motori', 'tensione logica', 'autonomia stimata', 'fusibile', 'temperatura driver', 'arresto di emergenza']
  };
}

function scooterPlan(goal) {
  return {
    type: 'electric_scooter',
    title: 'Monopattino elettrico — progetto modulare',
    goal,
    architecture: [
      'batteria+BMS → fusibile → controller → motore',
      'acceleratore/freni/sensori → controller',
      'caricatore compatibile → BMS/batteria'
    ],
    components: [
      component('motor', 'Motore mozzo/ruota', 'Trazione', 'electric scooter hub motor wheel 36V 48V', 'Tensione nominale e potenza devono corrispondere a controller, ruota e uso previsto.'),
      component('controller', 'Controller motore', 'Regolazione potenza e frenata', 'electric scooter controller 36V 48V brushless', 'Tensione batteria, corrente massima, tipo sensori Hall e acceleratore devono essere compatibili.'),
      component('battery', 'Batteria con BMS', 'Accumulo energia', 'electric scooter battery 36V 48V BMS certified', 'La tensione deve corrispondere al controller; BMS e celle devono sostenere la corrente continua e di picco.', 'Preferire batterie complete con BMS e certificazioni; non costruire pacchi litio da celle sciolte senza attrezzatura e competenza professionale.'),
      component('charger', 'Caricatore', 'Ricarica', 'electric scooter charger 42V 54.6V', 'La tensione di fine carica deve essere esattamente quella richiesta dal pacco batteria.', 'Un caricatore errato può causare incendio o danneggiamento della batteria.'),
      component('brakes', 'Freni', 'Arresto sicuro', 'electric scooter disc brake kit', 'Dischi, pinze, leve e attacchi devono essere compatibili con ruote e telaio.', 'La frenata è un sistema critico: collaudo statico e dinamico in area chiusa.'),
      component('throttle', 'Acceleratore/display', 'Comando utente', 'electric scooter throttle display hall', 'Segnale e connettore devono essere compatibili con il controller.'),
      component('frame', 'Telaio, forcella e sterzo', 'Struttura portante', 'electric scooter frame fork deck parts', 'Portata, geometria, ruota e attacchi freno devono essere coerenti.', 'Componenti strutturali richiedono controllo di cricche, giochi e serraggi.'),
      component('protection', 'Fusibile, cablaggio e connettori', 'Protezione elettrica', 'electric scooter fuse cable connector XT90', 'Corrente nominale con margine rispetto alla massima richiesta dal controller.', 'Usare connettori anti-scintilla e cablaggio dimensionato per la corrente.'),
      component('lights', 'Luci e segnalazione', 'Visibilità', 'electric scooter front rear light 36V 48V', 'Verificare tensione o prevedere convertitore DC-DC dedicato.')
    ],
    steps: [
      'Definire massa totale, velocità target, pendenza, autonomia e diametro ruota.',
      'Scegliere il sistema di tensione (es. 36 V o 48 V) e mantenerlo coerente tra batteria, controller e motore.',
      'Verificare prima telaio, sterzo, ruote e freni; la parte meccanica viene prima della potenza.',
      'Montare batteria con fissaggio meccanico, protezione da urti/acqua e fusibile vicino alla sorgente.',
      'Collegare controller, motore, freni e acceleratore seguendo gli schemi dei produttori.',
      'Eseguire test su cavalletto, poi a bassissima velocità in area privata e controllata.',
      'Verificare temperature, frenata, serraggi e requisiti legali locali prima dell’uso su strada.'
    ],
    checks: ['compatibilità tensione', 'corrente controller/BMS', 'freni', 'sterzo', 'fusibile', 'isolamento cablaggi', 'temperature', 'normativa locale']
  };
}

function genericPlan(goal) {
  return {
    type: 'generic',
    title: 'Progetto tecnico da definire',
    goal,
    architecture: [],
    components: [],
    steps: [
      'Definire funzione, ambiente d’uso, dimensioni, alimentazione, budget e prestazioni richieste.',
      'Scomporre il progetto in struttura, alimentazione, controllo, attuazione, sensori e sicurezza.',
      'Creare una distinta base e verificare compatibilità prima di acquistare.'
    ],
    checks: ['requisiti', 'compatibilità', 'sicurezza', 'manutenibilità']
  };
}

function createBuildPlan(input) {
  const goal = clean(input, 1000) || 'Progetto richiesto dall’utente';
  const type = detectBuildType(goal);
  const plan = type === 'robot' ? robotPlan(goal) : type === 'electric_scooter' ? scooterPlan(goal) : genericPlan(goal);
  return {
    ...plan,
    generated_by: 'zorgax-build-planner-v1',
    safety_boundary: 'Zorgax fornisce progettazione e sourcing. Non effettua acquisti, non attiva pagamenti e non sostituisce collaudi professionali o requisiti legali.',
    marketplace_queries: plan.components.map(item => ({ component_id: item.id, query: item.search_query }))
  };
}

async function braveSearch(query, limit) {
  const token = process.env.BRAVE_SEARCH_API_KEY;
  if (!token) return [];
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(Math.max(1, Math.min(limit, 10))));
  const response = await fetch(url, { headers: { Accept: 'application/json', 'X-Subscription-Token': token } });
  if (!response.ok) throw new Error(`Brave Search HTTP ${response.status}`);
  const data = await response.json();
  return (data.web?.results || []).map(item => ({ provider: 'brave', title: item.title, url: item.url, description: item.description || '' }));
}

async function tavilySearch(query, limit) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, query, search_depth: 'advanced', max_results: Math.max(1, Math.min(limit, 10)), include_answer: false })
  });
  if (!response.ok) throw new Error(`Tavily HTTP ${response.status}`);
  const data = await response.json();
  return (data.results || []).map(item => ({ provider: 'tavily', title: item.title, url: item.url, description: item.content || '' }));
}

function searchLinks(query) {
  return [
    ...DEFAULT_MARKETPLACES.map(provider => ({ provider: provider.id, title: `Cerca su ${provider.name}`, url: provider.buildUrl(query), description: 'Ricerca marketplace generata da Zorgax.' })),
    ...GENERAL_SEARCH.map(provider => ({ provider: provider.id, title: `Cerca sul web con ${provider.name}`, url: provider.buildUrl(query), description: 'Ricerca web generata da Zorgax.' }))
  ];
}

async function sourceComponents(plan, options = {}) {
  const live = options.live !== false;
  const limit = Math.max(1, Math.min(Number(options.limit) || 5, 10));
  const rows = [];
  const providerErrors = [];
  for (const item of plan.components) {
    let liveResults = [];
    if (live) {
      const providers = [braveSearch, tavilySearch];
      for (const provider of providers) {
        try {
          const found = await provider(item.search_query, limit);
          liveResults.push(...found);
        } catch (error) {
          providerErrors.push(error.message);
        }
      }
    }
    const seen = new Set();
    const results = [...liveResults, ...searchLinks(item.search_query)].filter(result => {
      if (!result.url || seen.has(result.url)) return false;
      seen.add(result.url);
      return true;
    });
    rows.push({
      component_id: item.id,
      component: item.name,
      query: item.search_query,
      compatibility: item.compatibility,
      safety: item.safety,
      results: results.slice(0, Math.max(limit, 8))
    });
  }
  return {
    providers: {
      brave_configured: Boolean(process.env.BRAVE_SEARCH_API_KEY),
      tavily_configured: Boolean(process.env.TAVILY_API_KEY),
      fallback_marketplaces: DEFAULT_MARKETPLACES.map(item => item.name),
      fallback_search: GENERAL_SEARCH.map(item => item.name)
    },
    provider_errors: providerErrors,
    components: rows,
    purchase_performed: false
  };
}

function isBuildIntent(text) {
  const value = clean(text, 1000).toLowerCase();
  return /(costru|assembl|progett|component|pezzi|ricambi|amazon|comprare|acquist)/.test(value) && /(robot|monopattino|scooter|e-scooter)/.test(value);
}

function buildContext(plan, sourcing) {
  const componentLines = plan.components.map(item => `- ${item.name}: ${item.purpose}; compatibilità: ${item.compatibility}${item.safety ? `; sicurezza: ${item.safety}` : ''}`);
  const sourceLines = (sourcing?.components || []).flatMap(item => item.results.slice(0, 3).map(result => `- ${item.component}: ${result.title} — ${result.url}`));
  return [
    'Zorgax Build & Source tool output follows. Treat this as a planning aid, not proof that a product is compatible or safe.',
    `Project: ${plan.title}`,
    'Components:',
    ...componentLines,
    'Suggested sourcing links:',
    ...sourceLines,
    'Never claim an item was purchased. Explicitly verify voltage/current/mechanical compatibility before recommending a final BOM.'
  ].join('\n');
}

module.exports = { detectBuildType, createBuildPlan, sourceComponents, isBuildIntent, buildContext };

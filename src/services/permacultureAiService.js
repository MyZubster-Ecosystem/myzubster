const { sha256Canonical } = require('./canonicalJsonService');

const PLAN_VERSION = 'permaculture-plan-v1';
const OLLAMA_URL = String(process.env.OLLAMA_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
const OLLAMA_MODEL = process.env.PERMACULTURE_OLLAMA_MODEL || process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const TIMEOUT_MS = Math.max(5000, Math.min(Number(process.env.PERMACULTURE_AI_TIMEOUT_MS) || 45000, 120000));

function plain(value) {
  return value && typeof value.toObject === 'function' ? value.toObject() : value || {};
}

function sizeBand(areaSqm) {
  if (areaSqm < 100) return 'micro';
  if (areaSqm < 500) return 'small';
  if (areaSqm < 2000) return 'medium';
  if (areaSqm < 10000) return 'large';
  return 'landscape';
}

function buildPlanningContext(site) {
  const source = plain(site);
  const profile = plain(source.profile);
  return {
    schemaVersion: 'permaculture-context-v1',
    siteType: source.siteType || 'rural',
    sizeBand: sizeBand(Number(profile.areaSqm) || 0),
    areaSqm: Number(profile.areaSqm) || 0,
    climateZone: profile.climateZone || 'unknown',
    soilTexture: profile.soilTexture || 'unknown',
    slope: profile.slope || 'unknown',
    waterSources: Array.isArray(profile.waterSources) ? [...profile.waterSources].sort() : [],
    goals: Array.isArray(profile.goals) ? [...profile.goals].sort() : [],
    constraints: Array.isArray(profile.constraints) ? [...profile.constraints].sort() : []
  };
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function rulesPlan(context, now = new Date()) {
  const zones = [
    {
      zone: 0,
      purpose: 'Centro operativo, osservazione e registrazione dei dati',
      elements: ['mappa del sito', 'registro stagionale', 'sensori non invasivi'],
      rationale: 'Le decisioni iniziano da osservazione, feedback e manutenzione misurabile.'
    },
    {
      zone: 1,
      purpose: 'Colture e funzioni ad alta frequenza di visita',
      elements: ['aromatiche', 'semenzaio', 'compost', 'raccolta acqua piovana'],
      rationale: 'Gli elementi visitati ogni giorno restano vicini al punto operativo.'
    }
  ];

  if (context.areaSqm >= 100) {
    zones.push({
      zone: 2,
      purpose: 'Policoltura perenne e food forest',
      elements: ['alberi da frutto', 'arbusti', 'coprisuolo', 'piante azotofissatrici'],
      rationale: 'Strati vegetali complementari aumentano resilienza e biodiversità.'
    });
  }
  if (context.areaSqm >= 500 && context.goals.includes('food_production')) {
    zones.push({
      zone: 3,
      purpose: 'Produzione alimentare estensiva a rotazione',
      elements: ['colture annuali', 'sovescio', 'rotazioni', 'fasce fiorite'],
      rationale: 'La produzione meno intensiva viene collocata oltre le aree a visita quotidiana.'
    });
  }
  if (context.areaSqm >= 2000) {
    zones.push({
      zone: 4,
      purpose: 'Risorse gestite a bassa intensità',
      elements: ['siepi frangivento', 'bosco ceduo', 'biomassa', 'corridoi ecologici'],
      rationale: 'Le risorse periodiche occupano le aree visitate meno spesso.'
    });
  }
  zones.push({
    zone: 5,
    purpose: 'Rifugio naturale senza produzione intensiva',
    elements: ['habitat spontaneo', 'legno morto', 'rifugi per impollinatori'],
    rationale: 'Una quota non gestita offre riferimento ecologico e habitat.'
  });

  const waterStrategy = ['Misurare pioggia, infiltrazione e consumi prima di dimensionare gli interventi.'];
  if (context.waterSources.includes('rainwater')) waterStrategy.push('Raccogliere e distribuire acqua piovana per gravità dove possibile.');
  if (['gentle', 'moderate', 'steep'].includes(context.slope)) waterStrategy.push('Progettare rallentamento e infiltrazione lungo le curve di livello dopo verifica tecnica del suolo.');
  if (context.constraints.includes('water_scarcity') || ['arid', 'mediterranean'].includes(context.climateZone)) {
    waterStrategy.push('Usare pacciamatura, ombreggiamento e specie adattate alla siccità; stabilire un budget idrico stagionale.');
  }

  const soilStrategy = ['Eseguire analisi del suolo prima di correzioni minerali o variazioni del pH.'];
  const soilAdvice = {
    sand: 'Aumentare sostanza organica stabile e copertura per migliorare ritenzione idrica.',
    clay: 'Evitare lavorazioni su suolo bagnato e favorire radici strutturanti e sostanza organica.',
    silt: 'Mantenere copertura continua e ridurre il ruscellamento superficiale.',
    loam: 'Proteggere la struttura con rotazioni, radici vive e disturbo minimo.',
    peat: 'Evitare drenaggi eccessivi e proteggere il carbonio organico del suolo.',
    mixed: 'Campionare più aree perché tessitura e fertilità possono variare nel sito.'
  };
  soilStrategy.push(soilAdvice[context.soilTexture] || 'Campionare il suolo per definire tessitura, sostanza organica e drenaggio.');

  const biodiversityStrategy = [
    'Usare specie locali e fioriture distribuite nelle stagioni.',
    'Connettere siepi, acqua, suolo coperto e rifugi in un corridoio ecologico.',
    'Evitare pesticidi ad ampio spettro e monitorare impollinatori e fauna utile.'
  ];
  if (context.goals.includes('seed_saving')) biodiversityStrategy.push('Separare e documentare le popolazioni destinate alla conservazione dei semi.');

  const risks = ['Il piano è preliminare e richiede sopralluogo umano, misure e verifica normativa.'];
  if (context.constraints.includes('fire_risk')) risks.push('Richiedere una valutazione antincendio locale prima di collocare biomassa, siepi o strutture.');
  if (context.slope === 'steep' || context.constraints.includes('erosion')) risks.push('Richiedere una verifica geotecnica/idrologica prima di movimenti terra o opere di ritenzione.');

  return {
    schemaVersion: PLAN_VERSION,
    provider: 'rules',
    model: 'myzubster-permaculture-rules-v1',
    generatedAt: now,
    inputCommitment: sha256Canonical(context),
    summary: `Piano preliminare ${context.sizeBand} per clima ${context.climateZone}, organizzato in ${zones.length} zone operative.`,
    zones,
    waterStrategy: unique(waterStrategy),
    soilStrategy: unique(soilStrategy),
    biodiversityStrategy: unique(biodiversityStrategy),
    risks: unique(risks),
    humanReviewRequired: true
  };
}

function safeText(value, maxLength) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid AI plan text');
  return value.trim().slice(0, maxLength);
}

function safeList(value, maxItems = 8, maxLength = 300) {
  if (!Array.isArray(value)) throw new Error('Invalid AI plan list');
  return unique(value.slice(0, maxItems).map(item => safeText(item, maxLength)));
}

function rejectLocationLikeOutput(raw) {
  const serialized = JSON.stringify(raw);
  const patterns = [
    /\b(?:lat|latitude|lng|longitude|coordinates?|address|indirizzo)\b\s*[:=]?\s*-?\d/i,
    /-?\d{1,2}\.\d{4,}\s*[,;]\s*-?\d{1,3}\.\d{4,}/
  ];
  if (patterns.some(pattern => pattern.test(serialized))) {
    throw new Error('AI plan contains location-like output');
  }
}

function validateGeneratedPlan(raw, context, now = new Date()) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.zones) || raw.zones.length === 0) {
    throw new Error('Invalid AI plan payload');
  }
  rejectLocationLikeOutput(raw);
  const zones = raw.zones.slice(0, 6).map(zone => {
    const number = Number(zone.zone);
    if (!Number.isInteger(number) || number < 0 || number > 5) throw new Error('Invalid AI zone');
    return {
      zone: number,
      purpose: safeText(zone.purpose, 240),
      elements: safeList(zone.elements, 8, 120),
      rationale: safeText(zone.rationale, 500)
    };
  });
  return {
    schemaVersion: PLAN_VERSION,
    provider: 'ollama',
    model: OLLAMA_MODEL,
    generatedAt: now,
    inputCommitment: sha256Canonical(context),
    summary: safeText(raw.summary, 1000),
    zones,
    waterStrategy: safeList(raw.waterStrategy),
    soilStrategy: safeList(raw.soilStrategy),
    biodiversityStrategy: safeList(raw.biodiversityStrategy),
    risks: safeList(raw.risks),
    humanReviewRequired: true
  };
}

function extractJson(content) {
  const text = String(content || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('AI response does not contain JSON');
  return JSON.parse(text.slice(start, end + 1));
}

async function ollamaPlan(context, options = {}) {
  const fetchImpl = options.fetchImpl || global.fetch;
  if (typeof fetchImpl !== 'function') throw new Error('fetch is unavailable');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || TIMEOUT_MS);
  try {
    const response = await fetchImpl(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: 'json',
        options: { temperature: 0.15 },
        messages: [
          {
            role: 'system',
            content: [
              'Sei un assistente di progettazione permaculturale prudente.',
              'Usa solo il contesto strutturato fornito; non chiedere o inferire indirizzi o coordinate.',
              'Restituisci solo JSON con: summary, zones, waterStrategy, soilStrategy, biodiversityStrategy, risks.',
              'Ogni zona contiene zone (0-5), purpose, elements e rationale.',
              'Il risultato è preliminare, non sostituisce sopralluogo, agronomo, geologo o verifica normativa.'
            ].join(' ')
          },
          { role: 'user', content: JSON.stringify(context) }
        ]
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);
    return validateGeneratedPlan(extractJson(data.message?.content), context, options.now || new Date());
  } finally {
    clearTimeout(timeout);
  }
}

async function generatePermaculturePlan(site, options = {}) {
  const context = buildPlanningContext(site);
  const mode = options.mode || process.env.PERMACULTURE_AI_MODE || 'hybrid';
  if (!['hybrid', 'ollama', 'rules'].includes(mode)) throw new Error('Invalid PERMACULTURE_AI_MODE');
  if (mode === 'rules') return rulesPlan(context, options.now || new Date());
  try {
    return await ollamaPlan(context, options);
  } catch (error) {
    if (mode === 'ollama') throw error;
    const fallback = rulesPlan(context, options.now || new Date());
    fallback.fallbackReason = 'Generative provider unavailable; deterministic rules used.';
    return fallback;
  }
}

module.exports = {
  PLAN_VERSION,
  buildPlanningContext,
  rulesPlan,
  validateGeneratedPlan,
  rejectLocationLikeOutput,
  generatePermaculturePlan
};

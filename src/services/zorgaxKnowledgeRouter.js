'use strict';

const DOMAIN_REGISTRY = Object.freeze([
  { domain: 'FERMENTATION', prefix: 'KF', categories: ['KEFIR', 'BAKING', 'WHEY', 'CHEESE', 'DEHYDRATION'], keywords: ['kefir','ferment','fermentation','fermentazione','siero','whey','lievit','pizza','focaccia'] },
  { domain: 'PROGRAMMING', prefix: 'DEV', categories: ['CODE','DEBUGGING','TOOLING','OPEN_SOURCE','MENTORING','DOCUMENTATION'], keywords: ['code','coding','programmazione','programmare','docker','bug','debug','github','javascript','node','software'] },
  { domain: 'UNIVERSITY', prefix: 'UNI', categories: ['RESEARCH','EXPERIMENT','PAPER','METHODOLOGY','REVIEW','COLLABORATION'], keywords: ['universita','university','ricerca','research','paper','studio','tesi','metodologia'] },
  { domain: 'ANIMALS', prefix: 'PET', categories: ['TRAINING','BEHAVIOUR','WELFARE','VETERINARY'], keywords: ['animale','animali','pet','cane','gatto','dog','cat','training','comportamento','veterin'] },
  { domain: 'PERMACULTURE', prefix: 'PERM', categories: ['SOIL','WATER','PLANTS','COMPOST','DESIGN','BIODIVERSITY','FOOD_FOREST','SEEDS','ANIMALS_IN_SYSTEM','BUILDING','ENERGY'], keywords: ['permacultura','permaculture','suolo','soil','compost','semi','seeds','biodivers','food forest'] },
  { domain: 'MUSIC', prefix: 'MUS', categories: ['INSTRUMENT','DJ','PRODUCTION','COMPOSITION','PERFORMANCE','RHYTHM','MIXING','LIVE','TEACHING'], keywords: ['musica','music','dj','strumento','instrument','produzione musicale','mixing','ritmo'] },
  { domain: 'ART', prefix: 'ART', categories: ['DRAWING','PAINTING','SCULPTURE','DIGITAL','COMICS','PHOTOGRAPHY','CRAFT','DESIGN','PERFORMANCE','TEACHING'], keywords: ['arte','art','disegno','drawing','comics','fumetti','painting','fotografia','photography'] },
  { domain: 'SPORT', prefix: 'SPT', categories: ['CALISTHENICS','STRENGTH','MOBILITY','CONDITIONING','TECHNIQUE','COACHING'], keywords: ['sport','calisthenics','calistenia','forza','strength','mobilita','mobility','allenamento','workout'] },
  { domain: 'MARTIAL_ARTS', prefix: 'MA', categories: ['THAI_BOXING','BOXING','KICKBOXING','GRAPPLING','TECHNIQUE','PADWORK','CONDITIONING','COACHING'], keywords: ['arti marziali','martial arts','thai boxing','muay thai','boxe','boxing','kickboxing','grappling','padwork'] },
  { domain: 'SOUNDSYSTEM', prefix: 'SND', categories: ['BUILD','ASSEMBLY','ELECTRONICS','ACOUSTICS','TUNING','DSP','REPAIR','OPERATION','EVENTS','DOCUMENTATION','TEACHING'], keywords: ['soundsystem','sound system','audio','acustica','acoustics','dsp','speaker','cassa','amplificatore'] },
  { domain: 'MONERO', prefix: 'XMR', categories: ['EDUCATION','PRIVACY','TECHNOLOGY','NODES','OPEN_SOURCE','COMMUNITY'], keywords: ['monero','xmr','privacy','nodo monero','monero node'] }
]);

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim();
}

function routeKnowledge(query, { limit = 3 } = {}) {
  const text = normalize(query);
  if (!text) return { query: '', matches: [], primary: null };
  const matches = DOMAIN_REGISTRY.map(entry => {
    let score = 0;
    const hits = [];
    for (const keyword of entry.keywords) {
      const key = normalize(keyword);
      if (key && text.includes(key)) { score += key.includes(' ') ? 4 : 2; hits.push(keyword); }
    }
    for (const category of entry.categories) {
      const key = normalize(category);
      if (key && text.includes(key)) { score += 5; hits.push(category); }
    }
    if (text.includes(entry.prefix.toLowerCase())) score += 3;
    return { domain: entry.domain, prefix: entry.prefix, categories: entry.categories, score, hits: [...new Set(hits)] };
  }).filter(x => x.score > 0).sort((a,b) => b.score - a.score || a.domain.localeCompare(b.domain)).slice(0, Math.max(1, Math.min(Number(limit) || 3, 5)));
  return { query: String(query), matches, primary: matches[0] || null };
}

function knowledgeGuidance(route) {
  if (!route || !route.primary) return 'No MyZubster knowledge category matched confidently. Ask one short clarifying question or search broadly; do not invent a category.';
  const p = route.primary;
  return [
    `Primary MyZubster knowledge domain: ${p.domain} (${p.prefix}-*).`,
    `Candidate categories: ${p.categories.join(', ')}.`,
    'Retrieve relevant Knowledge Cards and preserve their evidence state and provenance.',
    'Then look for related active skills, resource listings or collaboration requests.',
    'Present the member with the best matching knowledge first and a concrete next action; do not claim availability, competence, verification, payment or outcomes without runtime evidence.'
  ].join('\n');
}

module.exports = { DOMAIN_REGISTRY, normalize, routeKnowledge, knowledgeGuidance };

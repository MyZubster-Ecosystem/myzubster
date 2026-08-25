const crypto = require('crypto');

const DEFAULT_GATEWAY = 'https://myzubster-gateway.vercel.app';
const MAX_SOURCES = 8;

function clampLimit(value, fallback = 5) {
  return Math.max(1, Math.min(Number(value) || fallback, MAX_SOURCES));
}

function cleanText(value, max = 6000) {
  return String(value || '').trim().slice(0, max);
}

function dataIntent(text) {
  return /\b(salva|inserisci|registra|memorizza|aggiungi\s+(?:quest[oi]|dato|dati)|immetti)\b/i.test(String(text || ''));
}

function inferCategory(text) {
  const value = String(text || '').toLowerCase();
  if (/orto|pianta|semina|raccolto|terreno/.test(value)) return 'garden';
  if (/robot|sensore|motore|elettronica/.test(value)) return 'robotics';
  if (/lavoro|competenz|skill|candidato/.test(value)) return 'skills';
  if (/ambiente|acqua|aria|suolo|temperatura|umidit/.test(value)) return 'environment';
  if (/spesa|costo|prezzo|componente|pezzo/.test(value)) return 'procurement';
  return 'general';
}

function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function digestPreview(preview) {
  return crypto.createHash('sha256').update(stableJson(preview)).digest('hex');
}

function previewData(input) {
  const raw = cleanText(input, 12000);
  if (!raw) throw new Error('Dati mancanti');

  let parsed = null;
  try { parsed = JSON.parse(raw); } catch (_) {}
  const category = inferCategory(raw);
  const titleSeed = raw.replace(/\s+/g, ' ').slice(0, 100);
  const preview = {
    category,
    title: titleSeed || 'Dato inserito con Zorgax',
    data: parsed && typeof parsed === 'object' ? parsed : { notes: raw },
    source: 'zorgax_user_confirmed'
  };
  const digest = digestPreview(preview);
  return {
    preview,
    digest,
    confirmation: `CONFERMA ${digest.slice(0, 8)}`,
    persistent_write_performed: false
  };
}

async function braveSearch(query, limit) {
  const key = process.env.BRAVE_SEARCH_API_KEY;
  if (!key) return [];
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(limit));
  const response = await fetch(url, { headers: { Accept: 'application/json', 'X-Subscription-Token': key } });
  if (!response.ok) throw new Error(`Brave Search HTTP ${response.status}`);
  const json = await response.json();
  return (json.web?.results || []).slice(0, limit).map((item, index) => ({
    label: `B${index + 1}`, provider: 'brave', title: item.title, url: item.url, snippet: cleanText(item.description, 700)
  }));
}

async function tavilySearch(query, limit) {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: key, query, max_results: limit, search_depth: 'advanced', include_answer: false })
  });
  if (!response.ok) throw new Error(`Tavily HTTP ${response.status}`);
  const json = await response.json();
  return (json.results || []).slice(0, limit).map((item, index) => ({
    label: `T${index + 1}`, provider: 'tavily', title: item.title, url: item.url, snippet: cleanText(item.content, 700)
  }));
}

async function wikipediaSearch(query, limit) {
  const url = new URL('https://en.wikipedia.org/w/api.php');
  url.searchParams.set('action', 'query');
  url.searchParams.set('generator', 'search');
  url.searchParams.set('gsrsearch', query);
  url.searchParams.set('gsrlimit', String(limit));
  url.searchParams.set('prop', 'extracts|info');
  url.searchParams.set('inprop', 'url');
  url.searchParams.set('exintro', '1');
  url.searchParams.set('explaintext', '1');
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  const response = await fetch(url, { headers: { 'User-Agent': 'MyZubster-Zorgax/1.0' } });
  if (!response.ok) throw new Error(`Wikipedia HTTP ${response.status}`);
  const json = await response.json();
  return Object.values(json.query?.pages || {}).slice(0, limit).map((item, index) => ({
    label: `W${index + 1}`, provider: 'wikipedia', title: item.title, url: item.fullurl, snippet: cleanText(item.extract, 700)
  }));
}

function searchLinks(query) {
  const q = encodeURIComponent(query);
  return [
    { label: 'S1', provider: 'google', title: `Google: ${query}`, url: `https://www.google.com/search?q=${q}`, snippet: 'Ricerca web generale.' },
    { label: 'S2', provider: 'bing', title: `Bing: ${query}`, url: `https://www.bing.com/search?q=${q}`, snippet: 'Ricerca web generale.' },
    { label: 'S3', provider: 'duckduckgo', title: `DuckDuckGo: ${query}`, url: `https://duckduckgo.com/?q=${q}`, snippet: 'Ricerca web generale.' }
  ];
}

async function searchWeb(query, requestedLimit = 5) {
  const cleanQuery = cleanText(query, 500);
  if (!cleanQuery) return { query: '', sources: [], errors: [] };
  const limit = clampLimit(requestedLimit);
  const errors = [];
  const groups = await Promise.all([
    braveSearch(cleanQuery, limit).catch(error => { errors.push(error.message); return []; }),
    tavilySearch(cleanQuery, limit).catch(error => { errors.push(error.message); return []; }),
    wikipediaSearch(cleanQuery, Math.min(limit, 4)).catch(error => { errors.push(error.message); return []; })
  ]);
  const seen = new Set();
  const sources = groups.flat().filter(source => {
    if (!source.url || seen.has(source.url)) return false;
    seen.add(source.url); return true;
  }).slice(0, limit);
  if (!sources.length) sources.push(...searchLinks(cleanQuery));
  return { query: cleanQuery, sources, errors };
}

async function askGeneralAI(message, sources = [], history = []) {
  const gateway = String(process.env.ZORGAX_PUBLIC_AI_URL || DEFAULT_GATEWAY).replace(/\/$/, '');
  const sourceContext = sources.length ? `\n\nFONTI WEB (cita le etichette quando le usi):\n${sources.map(s => `[${s.label}] ${s.title}\n${s.url}\n${s.snippet}`).join('\n\n')}` : '';
  const prompt = `${cleanText(message)}${sourceContext}\n\nRispondi in modo utile e chiaro. Distingui fatti verificati, inferenze e incertezze. Non inventare fonti.`;
  const response = await fetch(`${gateway}/api/zargox/chat`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: prompt, useWeb: false, history: Array.isArray(history) ? history.slice(-12) : [] })
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`AI gateway HTTP ${response.status}`);
  return json.response || json.message || json.answer || '';
}

async function answer({ message, useWeb = true, history = [], limit = 5 }) {
  const text = cleanText(message);
  if (!text) throw new Error('Messaggio mancante');
  if (dataIntent(text)) {
    const dataPreview = previewData(text.replace(/^.*?\b(?:salva|inserisci|registra|memorizza|immetti)\b\s*/i, ''));
    return {
      response: `Ho preparato l'anteprima dei dati. Non ho salvato nulla. Per renderli persistenti devi confermare esplicitamente con: ${dataPreview.confirmation}`,
      data_preview: dataPreview,
      action_required: 'human_confirmation',
      sources: []
    };
  }
  const research = useWeb ? await searchWeb(text, limit) : { query: text, sources: [], errors: [] };
  const response = await askGeneralAI(text, research.sources, history);
  return { response, sources: research.sources, search_errors: research.errors, action_required: null };
}

module.exports = { answer, searchWeb, previewData, digestPreview, dataIntent, inferCategory };

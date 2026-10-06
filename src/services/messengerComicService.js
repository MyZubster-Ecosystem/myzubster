'use strict';

const COMIC_URL = 'https://www.myzubster.com/fumetto';
const RAW_MAIN = 'https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/main/docs/visuals/';
const RAW_VISUAL = 'https://raw.githubusercontent.com/MyZubster-Ecosystem/MyZubster-Visual/main/assets/comic/';

const assets = [
  { keys: ['origine','origins','fumetto','comic','storia','story'], url: RAW_MAIN + 'comic/01-origine-la-citta-come-organismo.png', label: 'MyZubster Comic Universe · Origins', kind: 'FICTION / CONCEPT' },
  { keys: ['manifesto','bitcoin','blockchain'], url: RAW_VISUAL + 'MyZubster-Cyberpunk-Visual-01-Manifesto-Neon.png', label: 'MyZubster · Manifesto Neon', kind: 'HISTORICAL_REFERENCE' },
  { keys: ['daniel','founder','chronicler'], url: RAW_VISUAL + 'MyZubster-Cyberpunk-Visual-02-Daniel-Chronicler.png', label: 'Daniel · Chronicler', kind: 'NARRATIVE / PUBLIC PROVENANCE' },
  { keys: ['evidence','prove','provenance','foto','photo'], url: RAW_VISUAL + 'MyZubster-Photos-Evidence-Dashboard-Source.png', label: 'MyZubster · Evidence visual', kind: 'EVIDENCE VISUAL' },
  { keys: ['roadmap'], url: RAW_VISUAL + 'MyZubster-Roadmap-High-Resolution-Source.png', label: 'MyZubster · Roadmap visual', kind: 'REFERENCE VISUAL' },
  { keys: ['bounty','contributor','community'], url: RAW_VISUAL + 'MyZubster-Bounty-526-Daniel-Combat-Concept.png', label: 'MyZubster · Contributor concept', kind: 'FICTION / CONCEPT' },
  { keys: ['sentinel','metasploit','scope'], url: RAW_VISUAL + 'metasploit-sentinel-scope-first.png', label: 'Metasploit Sentinel · Scope First', kind: 'REAL_EVIDENCE VISUAL' }
];

function normalize(value) { return String(value || '').toLowerCase(); }
function wantsComicImage(message) {
  const text = normalize(message);
  return /\b(fumett[oi]|comic|tavol[ae]|visual|immagin[ei]|picture|artwork|origins?)\b/.test(text);
}
function selectComicAsset(message) {
  const text = normalize(message);
  let best = assets[0]; let score = 0;
  for (const asset of assets) {
    const hits = asset.keys.filter(key => text.includes(key)).length;
    if (hits > score) { best = asset; score = hits; }
  }
  return best;
}
function comicContext(asset) {
  return `COMIC MEDIA CONTEXT: The MyZubster Comic Universe IS publicly available at ${COMIC_URL}. The attached public visual is "${asset.label}" (${asset.kind}). Never say the comic is unavailable or not public. Comic/fiction/concept visuals must never be presented as evidence of real events.`;
}
function comicReply(message, asset) {
  const text = normalize(message);
  const italian = /\b(mostrami|fumetto|immagine|tavola|storia|origine|ciao|voglio)\b/.test(text);
  if (italian) {
    return `Eccolo 👇\n${asset.label}\n\nIl MyZubster Comic Universe è pubblico e raccoglie tavole e visual provenienti dai repository GitHub del progetto.\n${COMIC_URL}\n\nNota: le visual fiction/concept sono narrative e non costituiscono prova di eventi reali.`;
  }
  return `Here it is 👇\n${asset.label}\n\nThe MyZubster Comic Universe is public and collects comic panels and visuals from the project's GitHub repositories.\n${COMIC_URL}\n\nNote: fiction/concept visuals are narrative media, not evidence of real events.`;
}
module.exports = { COMIC_URL, wantsComicImage, selectComicAsset, comicContext, comicReply, assets };

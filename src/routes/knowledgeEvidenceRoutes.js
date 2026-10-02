const express = require('express');
const {
  createKnowledgeEvidence,
  verifyKnowledgeEvidence
} = require('../services/knowledgeEvidenceService');
const { buildGithubWorkEvidence, verifyGithubWorkEvidence } = require('../services/githubWorkEvidenceService');
const { anchorMarketplaceEvidenceOnBase } = require('../services/baseMarketplaceAnchorService');
const { authenticate } = require('../middleware/auth');
const KnowledgeDraft = require('../models/KnowledgeDraft');
const User = require('../models/User');
const { normalizeKnowledgeDraft } = require('../services/knowledgeDraftService');
const mongoose = require('mongoose');

const router = express.Router();

// Only explicitly published cards are returned, and only their intended public fields.
router.get('/public', async (_req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    const cards = await KnowledgeDraft.find({ status: 'published', visibility: 'public' })
      .select('title domain description evidence verificationNote publishedAt publisherName')
      .sort({ publishedAt: -1 }).limit(100).lean();
    return res.json({ success: true, cards });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile leggere il catalogo' }); }
});

router.get('/public/:id', async (req, res) => {
  res.set('Cache-Control', 'no-store');
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ success: false, error: 'Scheda non trovata' });
  try {
    const card = await KnowledgeDraft.findOne({ _id: req.params.id, status: 'published', visibility: 'public' })
      .select('title domain description evidence verificationNote publishedAt publisherName').lean();
    if (!card) return res.status(404).json({ success: false, error: 'Scheda non trovata' });
    return res.json({ success: true, card });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile leggere la scheda' }); }
});

// Drafts are account-owned and private. A URL supplied as evidence is not a verification.
router.get('/drafts', authenticate, async (req, res) => {
  try {
    const drafts = await KnowledgeDraft.find({ ownerId: req.userId }).sort({ updatedAt: -1 }).limit(50).lean();
    return res.json({ success: true, drafts });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile leggere le bozze' }); }
});

router.post('/drafts', authenticate, async (req, res) => {
  let fields;
  try { fields = normalizeKnowledgeDraft(req.body); }
  catch (error) { return res.status(400).json({ success: false, error: error.message }); }
  try {
    if (await KnowledgeDraft.countDocuments({ ownerId: req.userId }) >= 50) {
      return res.status(409).json({ success: false, error: 'Limite di 50 bozze raggiunto' });
    }
    const draft = await KnowledgeDraft.create({ ...fields, ownerId: req.userId });
    return res.status(201).json({ success: true, draft });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile salvare la bozza' }); }
});

router.put('/drafts/:id', authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Scheda non valida' });
  let fields;
  try { fields = normalizeKnowledgeDraft(req.body); }
  catch (error) { return res.status(400).json({ success: false, error: error.message }); }
  try {
    const draft = await KnowledgeDraft.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId, status: 'draft', visibility: 'private' }, { $set: fields }, { new: true, runValidators: true }
    );
    return draft ? res.json({ success: true, draft }) : res.status(404).json({ success: false, error: 'Scheda non trovata' });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile aggiornare la bozza' }); }
});

router.post('/drafts/:id/publish', authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Scheda non valida' });
  if (req.body?.confirm !== true) return res.status(400).json({ success: false, error: 'Conferma esplicita richiesta' });
  try {
    const owner = await User.findById(req.userId).select('username').lean();
    if (!owner) return res.status(401).json({ success: false, error: 'Account non trovato' });
    const card = await KnowledgeDraft.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId, status: 'draft', visibility: 'private' },
      { $set: { status: 'published', visibility: 'public', publishedAt: new Date(), publisherName: owner.username } },
      { new: true, runValidators: true }
    );
    return card ? res.json({ success: true, card, url: `/knowledge-card?id=${card._id}` })
      : res.status(409).json({ success: false, error: 'Scheda non trovata o già pubblicata' });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile pubblicare la scheda' }); }
});

router.post('/drafts/:id/unpublish', authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Scheda non valida' });
  try {
    const card = await KnowledgeDraft.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.userId, status: 'published', visibility: 'public' },
      { $set: { status: 'draft', visibility: 'private' }, $unset: { publishedAt: '', publisherName: '' } },
      { new: true, runValidators: true }
    );
    return card ? res.json({ success: true, card })
      : res.status(409).json({ success: false, error: 'Scheda non trovata o già privata' });
  } catch (_) { return res.status(500).json({ success: false, error: 'Impossibile ritirare la scheda' }); }
});

// Existing published cards may predate automatic verification-note updates.
// The owner can explicitly repair a stale note without withdrawing their card.
router.post('/drafts/:id/refresh-github-note', authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success:false, error:'Scheda non valida' });
  if (req.body?.confirm !== true) return res.status(400).json({ success:false, error:'Conferma esplicita richiesta' });
  try {
    const card = await KnowledgeDraft.findOne({ _id:req.params.id, ownerId:req.userId }).lean();
    if (!card) return res.status(404).json({ success:false, error:'Scheda non trovata' });
    const sources = (card.evidence || []).filter(item => githubEvidenceTarget(item.url));
    if (!sources.length) return res.status(409).json({ success:false, error:'Nessuna fonte GitHub collegata alla scheda' });
    const updatedNote = noteAfterGithubEvidence(card.verificationNote).slice(0,1000);
    if (updatedNote === (card.verificationNote || '').trim()) return res.json({ success:true, unchanged:true, card });
    const updated = await KnowledgeDraft.findOneAndUpdate(
      { _id:req.params.id, ownerId:req.userId, verificationNote:card.verificationNote || '' },
      { $set:{ verificationNote:updatedNote } }, { new:true, runValidators:true }
    );
    return updated ? res.json({ success:true, card:updated }) : res.status(409).json({ success:false, error:'La scheda è cambiata; ricarica e riprova' });
  } catch (_) { return res.status(500).json({ success:false, error:'Impossibile aggiornare la nota di verifica' }); }
});

// A public GitHub PR/commit can document work, but cannot certify a skill.
function githubEvidenceTarget(raw) {
  let url;
  try { url = new URL(String(raw || '').trim()); } catch (_) { return null; }
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com' || url.search || url.hash || url.username || url.password || url.port) return null;
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length !== 4 || !/^[a-z\d_.-]+$/i.test(parts[0]) || !/^[a-z\d_.-]+$/i.test(parts[1])) return null;
  const [owner, repo, kind, value] = parts;
  if (kind === 'pull' && /^[1-9]\d{0,8}$/.test(value)) {
    return { kind: 'pull', url: 'https://github.com/'+owner+'/'+repo+'/pull/'+value, api: 'https://api.github.com/repos/'+owner+'/'+repo+'/pulls/'+value };
  }
  if (kind === 'commit' && /^[a-f0-9]{40}$/i.test(value)) {
    return { kind: 'commit', url: 'https://github.com/'+owner+'/'+repo+'/commit/'+value.toLowerCase(), api: 'https://api.github.com/repos/'+owner+'/'+repo+'/commits/'+value.toLowerCase() };
  }
  return null;
}

const DEFAULT_PENDING_GITHUB_NOTE = 'Attività dichiarate dal titolare; eventuali commit e PR devono essere aggiunti e controllati prima di considerarli evidenze del lavoro.';
const GITHUB_LINKED_NOTE = 'Almeno una fonte GitHub pubblica è stata collegata e ne è stata controllata la disponibilità. Contenuto, attribuzione e competenze non sono verificati indipendentemente.';
function noteAfterGithubEvidence(existing) {
  const previous = typeof existing === 'string' ? existing.trim() : '';
  if (!previous || previous === DEFAULT_PENDING_GITHUB_NOTE) {
    return 'Attività dichiarate dal titolare. ' + GITHUB_LINKED_NOTE;
  }
  // Also repair notes saved by the previous implementation, which dropped
  // punctuation before appending the standard GitHub evidence sentence.
  const linkedAt = previous.indexOf(GITHUB_LINKED_NOTE);
  const prefix = (linkedAt >= 0 ? previous.slice(0, linkedAt) : previous)
    .replace(DEFAULT_PENDING_GITHUB_NOTE, '').trim();
  const suffix = linkedAt >= 0 ? previous.slice(linkedAt + GITHUB_LINKED_NOTE.length).trim() : '';
  const normalizedPrefix = prefix ? (/[.!?]$/.test(prefix) ? prefix : prefix + '.') : '';
  const budget = 1000 - GITHUB_LINKED_NOTE.length - (suffix ? suffix.length + 1 : 0) - 1;
  const safePrefix = normalizedPrefix.slice(0, Math.max(0, budget)).trim();
  return (safePrefix ? safePrefix + ' ' : '') + GITHUB_LINKED_NOTE + (suffix ? ' ' + suffix : '');
}

router.post('/drafts/:id/github-evidence', authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success:false, error:'Scheda non valida' });
  if (req.body?.confirm !== true) return res.status(400).json({ success:false, error:'Conferma esplicita richiesta' });
  const target = githubEvidenceTarget(req.body?.url);
  if (!target) return res.status(400).json({ success:false, error:'Inserisci un URL di pull request o commit GitHub pubblico valido' });
  try {
    const card = await KnowledgeDraft.findOne({ _id:req.params.id, ownerId:req.userId }).lean();
    if (!card) return res.status(404).json({ success:false, error:'Scheda non trovata' });
    if ((card.evidence || []).some(item => item.url === target.url)) return res.json({ success:true, duplicate:true, card });
    if ((card.evidence || []).length >= 12) return res.status(409).json({ success:false, error:'La scheda ha già 12 fonti' });
    // Never send application OAuth tokens to GitHub for publicly readable evidence.
    const response = await fetch(target.api, { headers:{ Accept:'application/vnd.github+json', 'User-Agent':'MyZubster-Knowledge-Evidence' }, signal:AbortSignal.timeout(6000) });
    if (!response.ok) return res.status(422).json({ success:false, error:response.status === 404?'Fonte GitHub non pubblica o inesistente':'Impossibile verificare la disponibilità della fonte GitHub' });
    const found = await response.json();
    const author = typeof found.user?.login === 'string' ? found.user.login : (typeof found.author?.login === 'string' ? found.author.login : '');
    const label = target.kind === 'pull' ? 'GitHub PR #'+found.number : 'GitHub commit '+String(found.sha || '').slice(0,12);
    const detail = target.kind === 'pull' ? String(found.title || '') : String(found.commit?.message || '').split('\n')[0];
    const note = ('Fonte pubblica accessibile su GitHub'+(author?' · autore GitHub: @'+author:'')+(detail?' · '+detail:'')+'. Non certifica automaticamente competenza o attribuzione.').slice(0,500);
    const item = { label:label.slice(0,160), url:target.url, note };
    const updated = await KnowledgeDraft.findOneAndUpdate(
      { _id:req.params.id, ownerId:req.userId, 'evidence.url':{$ne:target.url}, 'evidence.11':{$exists:false} },
      { $push:{ evidence:item }, $set:{ verificationNote: noteAfterGithubEvidence(card.verificationNote).slice(0,1000) } }, { new:true, runValidators:true }
    );
    if (!updated) return res.status(409).json({ success:false, error:'Fonte già presente o limite raggiunto; ricarica la scheda' });
    return res.json({ success:true, card:updated, evidence:item, check:'PUBLIC_SOURCE_ACCESSIBLE_NOT_SKILL_VERIFIED' });
  } catch (error) {
    return res.status(502).json({ success:false, error:'Impossibile controllare la fonte GitHub in questo momento' });
  }
});

router.post('/', async (req, res) => {
  try {
    const anchor = req.body?.anchor === true;
    const result = await createKnowledgeEvidence(req.body || {}, { anchor });
    const code = result.anchor?.status === 'FAILED' ? 502 : 201;
    return res.status(code).json({ success: result.anchor?.status !== 'FAILED', ...result });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/verify', (req, res) => {
  try {
    const { payload, evidenceHash } = req.body || {};
    if (!payload || !evidenceHash) {
      return res.status(400).json({ success: false, error: 'payload and evidenceHash are required' });
    }
    const match = verifyKnowledgeEvidence(payload, evidenceHash);
    return res.status(match ? 200 : 409).json({
      success: match,
      status: match ? 'MATCH' : 'MISMATCH',
      algorithm: 'sha256',
      evidenceHash
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/github-work', async (req, res) => {
  try {
    const result = buildGithubWorkEvidence(req.body || {});
    let anchor = { status: 'NOT_REQUESTED' };
    if (req.body?.anchor === true) {
      try {
        anchor = await anchorMarketplaceEvidenceOnBase(result.evidenceHash);
      } catch (error) {
        anchor = { status: 'FAILED', error: error.message };
      }
    }
    const code = anchor.status === 'FAILED' ? 502 : 201;
    return res.status(code).json({ success: anchor.status !== 'FAILED', ...result, anchor });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/github-work/verify', (req, res) => {
  try {
    const { payload, evidenceHash } = req.body || {};
    if (!payload || !evidenceHash) return res.status(400).json({ success:false, error:'payload and evidenceHash are required' });
    const match = verifyGithubWorkEvidence(payload, evidenceHash);
    return res.status(match ? 200 : 409).json({ success:match, status:match?'MATCH':'MISMATCH', algorithm:'sha256', evidenceHash });
  } catch (error) {
    return res.status(400).json({ success:false, error:error.message });
  }
});

module.exports = router;

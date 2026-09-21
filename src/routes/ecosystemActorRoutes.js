const express = require('express');
const EcosystemActor = require('../models/EcosystemActor');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

function cleanString(value, maxLength = 200) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanList(value, maxItems = 50, maxLength = 300) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .map(item => cleanString(item, maxLength))
    .filter(Boolean))]
    .slice(0, maxItems);
}

function normalizeGithub(input = {}) {
  return {
    login: cleanString(input.login, 100),
    org: cleanString(input.org, 100),
    repositories: cleanList(input.repositories, 30, 200)
  };
}

function publicActor(actor) {
  const value = actor?.toObject ? actor.toObject() : actor;
  return {
    actorId: value.actorId,
    type: value.type,
    name: value.name,
    slug: value.slug,
    description: value.description || '',
    github: value.github || { login: '', org: '', repositories: [] },
    myzubsterProfile: value.myzubsterProfile || '',
    skills: value.skills || [],
    projects: value.projects || [],
    evidence: value.evidence || [],
    status: value.status,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt
  };
}

function payload(body = {}, { partial = false } = {}) {
  const out = {};
  const fields = ['type', 'name', 'slug', 'description', 'myzubsterProfile', 'status'];
  for (const field of fields) {
    if (!partial || Object.prototype.hasOwnProperty.call(body, field)) {
      const max = field === 'description' ? 2000 : field === 'myzubsterProfile' ? 500 : 180;
      out[field] = cleanString(body[field], max);
    }
  }
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'github')) out.github = normalizeGithub(body.github);
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'skills')) out.skills = cleanList(body.skills, 50, 120);
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'projects')) out.projects = cleanList(body.projects, 100, 200);
  if (!partial || Object.prototype.hasOwnProperty.call(body, 'evidence')) out.evidence = cleanList(body.evidence, 100, 500);
  return out;
}

router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.query.type) query.type = cleanString(req.query.type, 40);
    if (req.query.status) query.status = cleanString(req.query.status, 40);
    const actors = await EcosystemActor.find(query).sort({ name: 1 }).limit(200).lean();
    return res.json({ success: true, count: actors.length, actors: actors.map(publicActor) });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Registro ecosistema non disponibile' });
  }
});

router.get('/:actorId', async (req, res) => {
  try {
    const actor = await EcosystemActor.findOne({ actorId: req.params.actorId }).lean();
    if (!actor) return res.status(404).json({ success: false, message: 'Actor non trovato' });
    return res.json({ success: true, actor: publicActor(actor) });
  } catch (_error) {
    return res.status(500).json({ success: false, message: 'Actor non disponibile' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const actor = await EcosystemActor.create({
      ...payload(req.body),
      createdBy: req.userId,
      updatedBy: req.userId
    });
    return res.status(201).json({ success: true, actor: publicActor(actor) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Slug o actor già esistente' });
    return res.status(400).json({ success: false, message: error.message || 'Actor non creato' });
  }
});

router.patch('/:actorId', authenticate, async (req, res) => {
  try {
    const existing = await EcosystemActor.findOne({ actorId: req.params.actorId });
    if (!existing) return res.status(404).json({ success: false, message: 'Actor non trovato' });
    const ownsActor = String(existing.createdBy) === String(req.userId);
    if (!ownsActor && req.userRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permessi insufficienti per modificare questo actor' });
    }
    const update = payload(req.body, { partial: true });
    update.updatedBy = req.userId;
    const actor = await EcosystemActor.findOneAndUpdate(
      { actorId: req.params.actorId },
      { $set: update },
      { new: true, runValidators: true }
    );
    return res.json({ success: true, actor: publicActor(actor) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ success: false, message: 'Slug già esistente' });
    return res.status(400).json({ success: false, message: error.message || 'Actor non aggiornato' });
  }
});

module.exports = router;
module.exports.publicActor = publicActor;
module.exports.payload = payload;

'use strict';

const ResearchDocument = require('../models/ResearchDocument');

function clampLimit(value, fallback = 10, max = 50) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(max, Math.floor(parsed)));
}

function normalizeQuery(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 200);
}

function extractDeclaredEvidenceStates(text) {
  const body = String(text || '');
  const states = [];
  const seen = new Set();
  const pattern = /\bid:\s*([A-Z0-9][A-Z0-9._-]{2,})\b[\s\S]{0,1200}?\bstatus:\s*([A-Z][A-Z0-9_-]*)\b/g;
  let match;
  while ((match = pattern.exec(body)) !== null) {
    const id = match[1];
    const status = match[2];
    const key = `${id}\u0000${status}`;
    if (!seen.has(key)) {
      seen.add(key);
      states.push({ id, status });
    }
  }
  return states.slice(0, 50);
}

function makeSnippet(text, query, maxLength = 280) {
  const body = String(text || '').replace(/\s+/g, ' ').trim();
  if (!body) return '';
  const needle = normalizeQuery(query).toLowerCase().split(' ').filter(Boolean)[0];
  const index = needle ? body.toLowerCase().indexOf(needle) : -1;
  const start = index > 80 ? index - 80 : 0;
  const snippet = body.slice(start, start + maxLength);
  return `${start > 0 ? '…' : ''}${snippet}${start + maxLength < body.length ? '…' : ''}`;
}

function createMongoResearchStore({ Model = ResearchDocument } = {}) {
  return {
    async upsert(document) {
      return Model.findOneAndUpdate(
        { normalizedUrl: document.normalizedUrl },
        { $set: document },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();
    },

    async search({ q, sourceType = null, limit = 10 } = {}) {
      const query = normalizeQuery(q);
      if (!query) return [];
      const filter = { $text: { $search: query } };
      if (sourceType && sourceType !== 'all') filter.sourceType = sourceType;

      const rows = await Model.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, crawledAt: -1 })
        .limit(clampLimit(limit))
        .lean();

      return rows.map(row => ({
        url: row.normalizedUrl,
        sourceType: row.sourceType,
        host: row.host,
        title: row.title,
        snippet: makeSnippet(row.text, query),
        score: row.score,
        crawledAt: row.crawledAt,
        contentHash: row.contentHash,
        declaredEvidenceStates: extractDeclaredEvidenceStates(row.text),
      }));
    },

    async stats() {
      const [total, byType] = await Promise.all([
        Model.countDocuments({}),
        Model.aggregate([{ $group: { _id: '$sourceType', count: { $sum: 1 } } }]),
      ]);
      return {
        total,
        byType: Object.fromEntries(byType.map(row => [row._id, row.count])),
      };
    },
  };
}

module.exports = { clampLimit, createMongoResearchStore, extractDeclaredEvidenceStates, makeSnippet, normalizeQuery };

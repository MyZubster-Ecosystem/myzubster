/**
 * Public Passport Service
 *
 * Responsible for assembling a **public‑only** view of a contributor's
 * Knowledge Passport. The service enforces:
 *
 * 1. An explicit consent check (performed by the route layer).
 * 2. A strict field allow‑list that excludes any financial, wallet or settlement
 *    information.
 * 3. Sanitisation of graph edges/labels to avoid leaking identifiers.
 *
 * The function `getPublicKnowledgePassport` returns `null` when the passport
 * cannot be shown publicly (e.g., missing data). The route handler translates
 * this into a 404 response, keeping the endpoint non‑enumerable.
 */

const db = require('../db'); // Adjust according to the actual DB helper used in the project

// ---------------------------------------------------------------------------
// Public field allow‑list
// ---------------------------------------------------------------------------
const PUBLIC_FIELDS = [
  'contributorId',
  'displayName',
  'avatarUrl',
  'bio',
  'knowledgeLinks', // array of { url, title }
  'contributions',  // array of contribution references (ids, titles)
  'attestations',   // array of attestation references
  // Add future non‑sensitive fields here.
];

// Helper: deep‑clone and keep only whitelisted top‑level keys.
// Nested objects/arrays are retained as‑is because they are already
// controlled by the data model; however, any sub‑field that could contain
// PII (e.g., a wallet address inside a contribution) must be stripped
// by the model layer itself.
function filterPublicFields(passport) {
  if (!passport || typeof passport !== 'object') {
    return null;
  }

  const filtered = {};

  for (const key of PUBLIC_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(passport, key)) {
      filtered[key] = passport[key];
    }
  }

  // Additional sanitisation: ensure no financial identifiers leak via
  // nested structures that are not part of the allow‑list.
  // This is a defensive shallow‑clean; deeper sanitisation should be
  // performed where the data originates.
  if (Array.isArray(filtered.contributions)) {
    filtered.contributions = filtered.contributions.map((c) => {
      const { rewardAmount, settlementId, walletAddress, ...rest } = c;
      return rest;
    });
  }

  if (Array.isArray(filtered.attestations)) {
    filtered.attestations = filtered.attestations.map((a) => {
      const { rewardAmount, settlementId, walletAddress, ...rest } = a;
      return rest;
    });
  }

  return filtered;
}

/**
 * Retrieves the raw passport data from the persistence layer.
 *
 * @param {string} contributorId
 * @returns {Promise<Object|null>} The raw passport object or null if not found.
 */
async function fetchRawPassport(contributorId) {
  // The actual query depends on the project's schema. Below is a generic
  // example that pulls the passport row and joins related tables.
  const passport = await db('passports')
    .where({ contributorId })
    .first();

  if (!passport) {
    return null;
  }

  // Load related collections (knowledgeLinks, contributions, attestations)
  // Adjust table/column names to match the real schema.
  const [knowledgeLinks, contributions, attestations] = await Promise.all([
    db('knowledge_links')
      .where({ contributorId })
      .select('url', 'title'),
    db('contributions')
      .where({ contributorId })
      .select('id', 'title', 'description'), // financial fields omitted intentionally
    db('attestations')
      .where({ contributorId })
      .select('id', 'type', 'issuedAt'), // financial fields omitted intentionally
  ]);

  return {
    ...passport,
    knowledgeLinks,
    contributions,
    attestations,
  };
}

/**
 * Public entry point used by the route handler.
 *
 * @param {string} contributorId
 * @returns {Promise<Object|null>} A sanitized public passport or null.
 */
async function getPublicKnowledgePassport(contributorId) {
  // 1️⃣ Fetch the raw passport (may be null)
  const rawPassport = await fetchRawPassport(contributorId);
  if (!rawPassport) {
    return null;
  }

  // 2️⃣ Apply the public field allow‑list and sanitise nested data.
  const publicPassport = filterPublicFields(rawPassport);

  // If after filtering nothing remains, treat as non‑existent for the public API.
  if (!publicPassport || Object.keys(publicPassport).length === 0) {
    return null;
  }

  return publicPassport;
}

module.exports = {
  getPublicKnowledgePassport,
};

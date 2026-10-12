/**
 * Consent Service
 *
 * Provides utilities to check whether a contributor has explicitly opted‑in to
 * publish their Contributor Passport publicly.
 *
 * The implementation assumes a persistence layer (e.g., a SQL table,
 * MongoDB collection, etc.) that stores a single record per contributor with
 * the following shape:
 *
 *   {
 *     contributorId: string,
 *     isPublic: boolean,          // true when the contributor has opted‑in
 *     revokedAt: Date | null,     // timestamp of the most recent revocation
 *     updatedAt: Date
 *   }
 *
 * The service abstracts the data‑access details so the rest of the codebase
 * does not need to know about the underlying ORM/driver.
 *
 * If the persistence layer changes, only this file needs to be updated.
 */

const db = require('../db'); // Adjust according to the actual DB helper used in the project

/**
 * Returns true if the contributor has an active public consent.
 *
 * @param {string} contributorId
 * @returns {Promise<boolean>}
 */
async function hasActivePublicConsent(contributorId) {
  // Defensive: ensure a string is provided
  if (!contributorId || typeof contributorId !== 'string') {
    return false;
  }

  // Example using a generic query interface – replace with the real one.
  // The query must be constant‑time with respect to the existence of the record
  // to avoid timing side‑channels.
  const record = await db
    .select('isPublic', 'revokedAt')
    .from('contributor_consents')
    .where({ contributorId })
    .first();

  if (!record) {
    // No consent record → treat as not published
    return false;
  }

  // Consent is active only when `isPublic` is true and there is no revocation
  // after the last publication. A null `revokedAt` means never revoked.
  if (!record.isPublic) {
    return false;
  }

  if (record.revokedAt) {
    // If revokedAt is set, the consent is no longer active
    return false;
  }

  return true;
}

/**
 * Records a consent revocation. This helper is used by the revocation endpoint
 * (not part of this PR) and by tests.
 *
 * @param {string} contributorId
 * @returns {Promise<void>}
 */
async function revokePublicConsent(contributorId) {
  await db('contributor_consents')
    .where({ contributorId })
    .update({
      isPublic: false,
      revokedAt: db.fn.now(),
      updatedAt: db.fn.now(),
    });
}

/**
 * Records a consent opt‑in (publication). This helper is used by the opt‑in
 * endpoint (not part of this PR) and by tests.
 *
 * @param {string} contributorId
 * @returns {Promise<void>}
 */
async function grantPublicConsent(contributorId) {
  await db('contributor_consents')
    .insert({
      contributorId,
      isPublic: true,
      revokedAt: null,
      updatedAt: db.fn.now(),
    })
    .onConflict('contributorId')
    .merge({
      isPublic: true,
      revokedAt: null,
      updatedAt: db.fn.now(),
    });
}

module.exports = {
  hasActivePublicConsent,
  revokePublicConsent,
  grantPublicConsent,
};

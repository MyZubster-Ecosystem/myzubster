#!/usr/bin/env node
/**
 * Validates roadmap-2026.manifest.json against the contract expected by the
 * 2026 execution roadmap (issue #395) and cross-checks that every tracked
 * issue reference also appears in ROADMAP_2026.md.
 *
 * Usage:
 *   node scripts/validate-roadmap-manifest.js
 *
 * Exit codes:
 *   0 — manifest and doc are consistent
 *   1 — validation error(s), printed to stderr
 *
 * Zero runtime dependencies (Node >= 14, CommonJS).
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const MANIFEST_PATH = path.join(ROOT, 'roadmap-2026.manifest.json');
const ROADMAP_DOC_PATH = path.join(ROOT, 'ROADMAP_2026.md');

const VALID_STATUS = new Set(['pending', 'in_progress', 'done', 'blocked']);
const VALID_KIND = new Set(['blocker', 'task']);
const REF_PATTERN = /^#\d+$/;

/** @returns {string[]} list of validation errors (empty when valid). */
function validate(manifest, docContent) {
  const errors = [];

  if (manifest === null || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return ['manifest root must be a JSON object'];
  }

  if (typeof manifest.id !== 'string' || manifest.id.length === 0) {
    errors.push('"id" must be a non-empty string');
  }
  if (typeof manifest.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push('"version" must be a semver string, e.g. "1.0.0"');
  }
  if (!Number.isInteger(manifest.trackingIssue) || manifest.trackingIssue <= 0) {
    errors.push('"trackingIssue" must be a positive integer');
  }
  if (typeof manifest.northStar !== 'string' || manifest.northStar.length === 0) {
    errors.push('"northStar" must be a non-empty string');
  }
  if (
    !Array.isArray(manifest.priorities) ||
    manifest.priorities.length === 0 ||
    manifest.priorities.some((p) => typeof p !== 'string' || p.length === 0)
  ) {
    errors.push('"priorities" must be a non-empty array of non-empty strings');
  }
  if (!Array.isArray(manifest.phases) || manifest.phases.length === 0) {
    errors.push('"phases" must be a non-empty array');
    return errors;
  }

  const seenPhaseIds = new Set();
  const seenRefs = new Set();

  manifest.phases.forEach((phase, i) => {
    const where = `phases[${i}]`;

    if (typeof phase.id !== 'string' || phase.id.length === 0) {
      errors.push(`${where}: "id" must be a non-empty string`);
    } else if (seenPhaseIds.has(phase.id)) {
      errors.push(`${where}: duplicate phase id "${phase.id}"`);
    } else {
      seenPhaseIds.add(phase.id);
    }

    if (typeof phase.name !== 'string' || phase.name.length === 0) {
      errors.push(`${where}: "name" must be a non-empty string`);
    }
    if (typeof phase.objective !== 'string' || phase.objective.length === 0) {
      errors.push(`${where}: "objective" must be a non-empty string`);
    }
    if (!VALID_STATUS.has(phase.status)) {
      errors.push(`${where}: "status" must be one of ${[...VALID_STATUS].join(', ')}`);
    }
    if (phase.gate !== null && typeof phase.gate !== 'string') {
      errors.push(`${where}: "gate" must be a string or null`);
    }
    if (
      !Array.isArray(phase.definitionOfDone) ||
      phase.definitionOfDone.some((d) => typeof d !== 'string')
    ) {
      errors.push(`${where}: "definitionOfDone" must be an array of strings`);
    }
    if (!Array.isArray(phase.items) || phase.items.length === 0) {
      errors.push(`${where}: "items" must be a non-empty array`);
      return;
    }

    phase.items.forEach((item, j) => {
      const itemWhere = `${where}.items[${j}]`;

      if (typeof item.title !== 'string' || item.title.length === 0) {
        errors.push(`${itemWhere}: "title" must be a non-empty string`);
      }
      if (!VALID_KIND.has(item.kind)) {
        errors.push(`${itemWhere}: "kind" must be one of ${[...VALID_KIND].join(', ')}`);
      }
      if (item.ref !== null) {
        if (typeof item.ref !== 'string' || !REF_PATTERN.test(item.ref)) {
          errors.push(`${itemWhere}: "ref" must be null or shaped like "#123"`);
        } else if (seenRefs.has(item.ref)) {
          errors.push(`${itemWhere}: issue ${item.ref} is referenced more than once`);
        } else {
          seenRefs.add(item.ref);
          if (docContent !== null && !docContent.includes(item.ref)) {
            errors.push(`${itemWhere}: ${item.ref} is missing from ROADMAP_2026.md`);
          }
        }
      }
      if ('group' in item && typeof item.group !== 'string') {
        errors.push(`${itemWhere}: "group" must be a string when present`);
      }
    });
  });

  if (errors.length === 0 && docContent !== null) {
    const trackingRef = `#${manifest.trackingIssue}`;
    if (!docContent.includes(trackingRef)) {
      errors.push(`ROADMAP_2026.md does not mention tracking issue ${trackingRef}`);
    }
  }

  return errors;
}

function main() {
  let rawManifest;
  try {
    rawManifest = fs.readFileSync(MANIFEST_PATH, 'utf8');
  } catch (err) {
    console.error(`[roadmap-manifest] INVALID: cannot read ${MANIFEST_PATH}: ${err.message}`);
    process.exit(1);
  }

  let manifest;
  try {
    manifest = JSON.parse(rawManifest);
  } catch (err) {
    console.error(`[roadmap-manifest] INVALID: manifest is not valid JSON: ${err.message}`);
    process.exit(1);
  }

  let docContent = null;
  try {
    docContent = fs.readFileSync(ROADMAP_DOC_PATH, 'utf8');
  } catch (err) {
    console.error(`[roadmap-manifest] INVALID: cannot read ${ROADMAP_DOC_PATH}: ${err.message}`);
    process.exit(1);
  }

  const errors = validate(manifest, docContent);
  if (errors.length > 0) {
    errors.forEach((e) => console.error(`[roadmap-manifest] INVALID: ${e}`));
    process.exit(1);
  }

  const itemCount = manifest.phases.reduce((acc, p) => acc + p.items.length, 0);
  console.log(
    `[roadmap-manifest] OK — ${manifest.phases.length} phases, ${itemCount} items, ` +
      `tracking issue #${manifest.trackingIssue}`
  );
}

main();

#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const WEIGHTS = Object.freeze({
  CLAIM_ACCEPTED: 1,
  SUBMISSION_ACCEPTED_FOR_REVIEW: 2,
  BOUNTY_VERIFIED: 10,
  MYZ_RECORDED: 3,
  SECURITY_DISCLOSURE_VALID: 15,
  REVISION_COMPLETED: 4,
  BOUNTY_REJECTED: -2
});

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function hash(value) {
  return crypto.createHash('sha256').update(canonical(value)).digest('hex');
}

function validateEvent(event) {
  if (!event || typeof event !== 'object') throw new Error('event must be an object');
  for (const key of ['event_id', 'contributor_id', 'type', 'at', 'evidence']) {
    if (!event[key]) throw new Error(`missing ${key}`);
  }
  if (!(event.type in WEIGHTS)) throw new Error(`unsupported event type ${event.type}`);
  if (!Array.isArray(event.evidence) || event.evidence.length === 0) throw new Error('evidence must be a non-empty array');
}

function summarize(events) {
  const seen = new Set();
  const byContributor = new Map();
  for (const event of events) {
    validateEvent(event);
    if (seen.has(event.event_id)) throw new Error(`duplicate event_id ${event.event_id}`);
    seen.add(event.event_id);
    const profile = byContributor.get(event.contributor_id) ?? {
      contributor_id: event.contributor_id,
      score: 0,
      claimed: 0,
      submitted: 0,
      verified: 0,
      rejected: 0,
      myz_recorded_events: 0,
      categories: new Set(),
      programs: new Set(),
      first_event_at: event.at,
      last_event_at: event.at,
      evidence: []
    };
    profile.score += WEIGHTS[event.type];
    if (event.type === 'CLAIM_ACCEPTED') profile.claimed++;
    if (event.type === 'SUBMISSION_ACCEPTED_FOR_REVIEW') profile.submitted++;
    if (event.type === 'BOUNTY_VERIFIED' || event.type === 'SECURITY_DISCLOSURE_VALID') profile.verified++;
    if (event.type === 'BOUNTY_REJECTED') profile.rejected++;
    if (event.type === 'MYZ_RECORDED') profile.myz_recorded_events++;
    if (event.category) profile.categories.add(event.category);
    if (event.program) profile.programs.add(event.program);
    if (event.at < profile.first_event_at) profile.first_event_at = event.at;
    if (event.at > profile.last_event_at) profile.last_event_at = event.at;
    profile.evidence.push(...event.evidence);
    byContributor.set(event.contributor_id, profile);
  }
  return [...byContributor.values()].map(p => ({
    ...p,
    categories: [...p.categories].sort(),
    programs: [...p.programs].sort(),
    evidence: [...new Set(p.evidence)].sort()
  })).sort((a,b) => b.score - a.score || a.contributor_id.localeCompare(b.contributor_id));
}

const [,, command='help', input='bounty-engine/reputation/events.json'] = process.argv;
if (command === 'weights') {
  console.log(JSON.stringify(WEIGHTS, null, 2));
} else if (command === 'build') {
  const data = JSON.parse(fs.readFileSync(input, 'utf8'));
  if (!Array.isArray(data.events)) throw new Error('input must contain events[]');
  const contributors = summarize(data.events);
  const output = {schema:'myzubster-contributor-reputation/v1', generated_at:new Date().toISOString(), contributors, source_hash:hash(data.events)};
  console.log(JSON.stringify(output, null, 2));
} else if (command === 'verify') {
  const data = JSON.parse(fs.readFileSync(input, 'utf8'));
  if (!Array.isArray(data.events)) throw new Error('input must contain events[]');
  summarize(data.events);
  console.log(JSON.stringify({valid:true, events:data.events.length, sha256:hash(data.events)}, null, 2));
} else {
  console.log('Usage: node bounty-engine/reputation/reputation.mjs <weights|verify|build> [events.json]');
}
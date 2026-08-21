#!/usr/bin/env node
import fs from 'node:fs';
import crypto from 'node:crypto';

const [,, cmd, ...args] = process.argv;
const load = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const save = (p, v) => fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

function usage() {
  console.log(`Usage:\n  node bounty-engine/engine.mjs validate <registry.json>\n  node bounty-engine/engine.mjs transition <registry.json> <bounty_id> <to_state> [actor] [note]\n  node bounty-engine/engine.mjs hash <registry.json>`);
}

const machine = load(new URL('./state-machine.json', import.meta.url));
const allowedStates = new Set(machine.states);

function validateRegistry(reg) {
  const errors = [];
  if (!reg || !Array.isArray(reg.bounties)) errors.push('registry.bounties must be an array');
  const ids = new Set();
  for (const b of reg.bounties || []) {
    if (!b.bounty_id) errors.push('missing bounty_id');
    else if (ids.has(b.bounty_id)) errors.push(`duplicate bounty_id: ${b.bounty_id}`);
    else ids.add(b.bounty_id);
    if (!allowedStates.has(b.status)) errors.push(`${b.bounty_id}: invalid status ${b.status}`);
    if (!Number.isInteger(b.reward_myz) || b.reward_myz < 0) errors.push(`${b.bounty_id}: invalid reward_myz`);
    if (!Array.isArray(b.history)) errors.push(`${b.bounty_id}: history must be an array`);
    if (b.status === 'MYZ_RECORDED' && !b.ledger_entry_id) errors.push(`${b.bounty_id}: MYZ_RECORDED requires ledger_entry_id`);
    if (b.ledger_entry_id && b.status !== 'MYZ_RECORDED') errors.push(`${b.bounty_id}: ledger_entry_id is only valid in MYZ_RECORDED state`);
  }
  return errors;
}

if (cmd === 'validate') {
  const [path] = args;
  if (!path) { usage(); process.exit(2); }
  const reg = load(path);
  const errors = validateRegistry(reg);
  if (errors.length) {
    console.error(errors.join('\n'));
    process.exit(1);
  }
  console.log(`OK: ${reg.bounties.length} bounty record(s) valid`);
} else if (cmd === 'transition') {
  const [path, bountyId, to, actor = null, note = null] = args;
  if (!path || !bountyId || !to) { usage(); process.exit(2); }
  const reg = load(path);
  const errors = validateRegistry(reg);
  if (errors.length) throw new Error(errors.join('; '));
  const b = reg.bounties.find(x => x.bounty_id === bountyId);
  if (!b) throw new Error(`Unknown bounty_id: ${bountyId}`);
  const allowed = machine.transitions[b.status] || [];
  if (!allowed.includes(to)) throw new Error(`Illegal transition ${b.status} -> ${to}`);
  if (to === 'MYZ_RECORDED' && !b.ledger_entry_id) throw new Error('Set ledger_entry_id before transition to MYZ_RECORDED');
  const from = b.status;
  b.status = to;
  b.history.push({ at: new Date().toISOString(), from, to, actor, note });
  reg.generated_at = new Date().toISOString();
  save(path, reg);
  console.log(`${bountyId}: ${from} -> ${to}`);
} else if (cmd === 'hash') {
  const [path] = args;
  if (!path) { usage(); process.exit(2); }
  const bytes = fs.readFileSync(path);
  console.log(crypto.createHash('sha256').update(bytes).digest('hex'));
} else {
  usage();
  process.exit(cmd ? 2 : 0);
}

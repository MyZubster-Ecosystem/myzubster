import assert from 'node:assert/strict';
import { integrateVerifiedReward } from './integrate.mjs';

const ledger={schema:'myzubster-myz-ledger/v1',asset:'MYZ',asset_type:'internal-reward-accounting-unit',on_chain:false,entries:[],integrity:{canonicalization:'json-key-sort-v1',sha256:null,signature:null},notes:[]};
const proposal={schema:'myzubster-myz-ledger-proposal/v1',proposal_id:'MYZP-TEST1',created_at:new Date().toISOString(),asset:'MYZ',amount:500,beneficiary:'contributor:test',reason:'Verified bounty ID-BNT-0002',evidence:{claim_id:'CLM-1',submission_id:'SUB-1',review_id:'REV-1',service_event_id:'SVC-1'},canonical_ledger_entry_id:null,status:'PROPOSED_NOT_RECORDED'};
const bounty={bounty_id:'ID-BNT-0002',program:'identity',title:'Open-source identity verifier',reward_myz:500,status:'VERIFIED',ledger_entry_id:null,history:[]};

const out=integrateVerifiedReward({proposal,bounty,ledger});
assert.equal(out.entry.amount_myz,500);
assert.equal(out.entry.status,'RECORDED');
assert.equal(out.entry.account_id,'contributor:test');
assert.equal(out.proposal.status,'MYZ_RECORDED');
assert.equal(out.proposal.canonical_ledger_entry_id,out.entry.entry_id);
assert.equal(out.bounty.status,'MYZ_RECORDED');
assert.equal(out.bounty.ledger_entry_id,out.entry.entry_id);
assert.equal(out.ledger.entries.length,1);

assert.throws(()=>integrateVerifiedReward({proposal,bounty,ledger:out.ledger}),/duplicate MYZ recording/);
assert.throws(()=>integrateVerifiedReward({proposal:{...proposal,reason:'Verified bounty COMIC-BNT-0001'},bounty,ledger}),/proposal\/bounty mismatch/);
assert.throws(()=>integrateVerifiedReward({proposal,bounty:{...bounty,status:'SUBMITTED'},ledger}),/bounty must be VERIFIED/);

console.log('workshop/app/integrate.test.mjs: ok');

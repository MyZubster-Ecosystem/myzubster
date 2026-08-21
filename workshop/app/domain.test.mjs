import test from 'node:test';
import assert from 'node:assert/strict';
import {createServiceEvent,createBountyClaim,createSubmission,reviewSubmission,createLedgerProposal,validateWorkflow} from './domain.mjs';

const service=()=>createServiceEvent({assetType:'electric-scooter',model:'KuKirin G2 Max',symptom:'does-not-power-on',checks:['battery voltage','controller input']});

test('verified workflow can create MYZ proposal',()=>{
  const s=service();
  const claim=createBountyClaim({serviceEvent:s,bountyId:'WORKSHOP-BNT-TEST',claimant:'contributor',rewardMyz:100});
  const submission=createSubmission({serviceEvent:s,claim,evidence:['sha256:example']});
  const review=reviewSubmission({submission,reviewer:'reviewer',decision:'VERIFIED',notes:'reproduced'});
  const ledgerProposal=createLedgerProposal({claim,submission,review});
  assert.equal(ledgerProposal.amount,100);
  assert.equal(ledgerProposal.status,'PROPOSED_NOT_RECORDED');
  assert.equal(validateWorkflow({serviceEvent:s,claim,submission,review,ledgerProposal}).ok,true);
});

test('rejected workflow cannot create MYZ proposal',()=>{
  const s=service();
  const claim=createBountyClaim({serviceEvent:s,bountyId:'WORKSHOP-BNT-TEST',claimant:'contributor',rewardMyz:100});
  const submission=createSubmission({serviceEvent:s,claim});
  const review=reviewSubmission({submission,reviewer:'reviewer',decision:'REJECTED'});
  assert.throws(()=>createLedgerProposal({claim,submission,review}),/VERIFIED/);
});

test('MYZ_RECORDED without canonical ledger id is invalid',()=>{
  const s=service();
  const claim=createBountyClaim({serviceEvent:s,bountyId:'WORKSHOP-BNT-TEST',claimant:'contributor',rewardMyz:100});
  const submission=createSubmission({serviceEvent:s,claim});
  const review=reviewSubmission({submission,reviewer:'reviewer',decision:'VERIFIED'});
  const ledgerProposal=createLedgerProposal({claim,submission,review});
  ledgerProposal.status='MYZ_RECORDED';
  assert.equal(validateWorkflow({serviceEvent:s,claim,submission,review,ledgerProposal}).ok,false);
});

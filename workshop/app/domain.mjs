export const BOUNTY_STATES = ['OPEN','CLAIMED','SUBMITTED','UNDER_REVIEW','VERIFIED','REJECTED','MYZ_RECORDED'];

export function makeId(prefix='OBJ') {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
}

export function createServiceEvent({assetType, model, symptom, publicRecordAllowed=false, checks=[]}) {
  return {
    schema: 'myzubster-service-event/v1',
    event_id: makeId('SVC'),
    created_at: new Date().toISOString(),
    asset: {type: assetType, model, public_identifier: null},
    symptom,
    checks: checks.map(check => ({check, status:'PLANNED', measurement:null, result:null, evidence_sha256:null})),
    diagnosis: null,
    repair_outcome: null,
    status: 'DIAGNOSING',
    contributors: [],
    bounty_id: null,
    consent: {public_record_allowed: !!publicRecordAllowed, evidence_publication_allowed:false}
  };
}

export function createBountyClaim({serviceEvent, bountyId, claimant, rewardMyz}) {
  if (!serviceEvent?.event_id) throw new Error('service event required');
  if (!bountyId || !claimant) throw new Error('bountyId and claimant required');
  if (!Number.isInteger(rewardMyz) || rewardMyz < 0) throw new Error('rewardMyz must be a non-negative integer');
  serviceEvent.bounty_id = bountyId;
  return {
    schema: 'myzubster-bounty-claim/v1',
    claim_id: makeId('CLM'),
    bounty_id: bountyId,
    service_event_id: serviceEvent.event_id,
    claimant,
    reward_myz: rewardMyz,
    status: 'CLAIMED',
    claimed_at: new Date().toISOString()
  };
}

export function createSubmission({serviceEvent, claim, evidence=[]}) {
  if (!serviceEvent?.event_id || !claim?.claim_id) throw new Error('service event and claim required');
  if (claim.status !== 'CLAIMED') throw new Error('claim must be CLAIMED');
  return {
    schema: 'myzubster-bounty-submission/v1',
    submission_id: makeId('SUB'),
    bounty_id: claim.bounty_id,
    claim_id: claim.claim_id,
    service_event_id: serviceEvent.event_id,
    claimant: claim.claimant,
    submitted_at: new Date().toISOString(),
    evidence,
    service_event_snapshot: structuredClone(serviceEvent),
    status: 'SUBMITTED'
  };
}

export function reviewSubmission({submission, reviewer, decision, notes=''}) {
  if (!submission?.submission_id) throw new Error('submission required');
  if (!reviewer) throw new Error('reviewer required');
  if (!['VERIFIED','REJECTED','REVISION_REQUESTED'].includes(decision)) throw new Error('invalid review decision');
  return {
    schema: 'myzubster-bounty-review/v1',
    review_id: makeId('REV'),
    submission_id: submission.submission_id,
    bounty_id: submission.bounty_id,
    reviewer,
    decision,
    notes,
    reviewed_at: new Date().toISOString()
  };
}

export function createLedgerProposal({claim, submission, review}) {
  if (!claim || !submission || !review) throw new Error('claim, submission and review required');
  if (review.decision !== 'VERIFIED') throw new Error('only VERIFIED submissions may propose a MYZ ledger entry');
  return {
    schema: 'myzubster-myz-ledger-proposal/v1',
    proposal_id: makeId('MYZP'),
    created_at: new Date().toISOString(),
    asset: 'MYZ',
    amount: claim.reward_myz,
    beneficiary: claim.claimant,
    reason: `Verified bounty ${claim.bounty_id}`,
    evidence: {
      claim_id: claim.claim_id,
      submission_id: submission.submission_id,
      review_id: review.review_id,
      service_event_id: claim.service_event_id
    },
    canonical_ledger_entry_id: null,
    status: 'PROPOSED_NOT_RECORDED',
    settlement_note: 'Internal accounting proposal only. Not fiat or blockchain settlement.'
  };
}

export function validateWorkflow(bundle) {
  const errors=[];
  if (bundle.claim && !bundle.serviceEvent) errors.push('claim requires serviceEvent');
  if (bundle.submission && !bundle.claim) errors.push('submission requires claim');
  if (bundle.review && !bundle.submission) errors.push('review requires submission');
  if (bundle.ledgerProposal && bundle.review?.decision !== 'VERIFIED') errors.push('ledger proposal requires VERIFIED review');
  if (bundle.ledgerProposal?.status === 'MYZ_RECORDED' && !bundle.ledgerProposal.canonical_ledger_entry_id) errors.push('MYZ_RECORDED requires canonical ledger entry id');
  return {ok: errors.length===0, errors};
}

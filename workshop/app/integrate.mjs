export function buildLedgerEntry({proposal, existingLedger}) {
  if (!proposal || proposal.schema !== 'myzubster-myz-ledger-proposal/v1') throw new Error('valid ledger proposal required');
  if (proposal.status !== 'PROPOSED_NOT_RECORDED') throw new Error('proposal must be PROPOSED_NOT_RECORDED');
  if (!Number.isFinite(proposal.amount) || proposal.amount <= 0) throw new Error('proposal amount must be positive');
  if (!proposal.beneficiary) throw new Error('proposal beneficiary required');
  if (!proposal.evidence?.review_id) throw new Error('verified review evidence required');
  if (!existingLedger || existingLedger.schema !== 'myzubster-myz-ledger/v1') throw new Error('canonical MYZ ledger required');

  const duplicate = (existingLedger.entries || []).find(e =>
    e?.source?.proposal_id === proposal.proposal_id ||
    e?.source?.review_id === proposal.evidence.review_id
  );
  if (duplicate) throw new Error(`duplicate MYZ recording: ${duplicate.entry_id}`);

  return {
    entry_id: `MYZ-${proposal.proposal_id}`,
    amount_myz: proposal.amount,
    account_id: proposal.beneficiary,
    timestamp: new Date().toISOString(),
    status: 'RECORDED',
    reason: proposal.reason,
    source: {
      proposal_id: proposal.proposal_id,
      bounty_id: proposal.evidence.claim_id ? proposal.reason.replace(/^Verified bounty\s+/, '') : null,
      claim_id: proposal.evidence.claim_id,
      submission_id: proposal.evidence.submission_id,
      review_id: proposal.evidence.review_id,
      service_event_id: proposal.evidence.service_event_id
    },
    settlement: {
      type: 'internal-reward-accounting',
      on_chain: false,
      fiat_payment_proven: false
    }
  };
}

export function applyLedgerEntry({proposal, ledger}) {
  const entry = buildLedgerEntry({proposal, existingLedger: ledger});
  const nextLedger = structuredClone(ledger);
  nextLedger.entries.push(entry);
  return {entry, ledger: nextLedger};
}

export function markProposalRecorded({proposal, entry}) {
  if (!entry?.entry_id || entry.status !== 'RECORDED') throw new Error('RECORDED ledger entry required');
  return {
    ...proposal,
    canonical_ledger_entry_id: entry.entry_id,
    status: 'MYZ_RECORDED'
  };
}

export function markBountyRecorded({bounty, proposal, entry}) {
  if (!bounty?.bounty_id) throw new Error('bounty required');
  if (bounty.status !== 'VERIFIED') throw new Error('bounty must be VERIFIED before MYZ recording');
  if (!entry?.entry_id || entry.status !== 'RECORDED') throw new Error('RECORDED ledger entry required');

  const next = structuredClone(bounty);
  next.status = 'MYZ_RECORDED';
  next.ledger_entry_id = entry.entry_id;
  next.history = Array.isArray(next.history) ? next.history : [];
  next.history.push({
    at: entry.timestamp,
    from: 'VERIFIED',
    to: 'MYZ_RECORDED',
    actor: 'myz-ledger-adapter/v1',
    note: `Recorded from proposal ${proposal.proposal_id}`
  });
  return next;
}

export function integrateVerifiedReward({proposal, bounty, ledger}) {
  if (!proposal || !bounty || !ledger) throw new Error('proposal, bounty and ledger required');
  if (bounty.bounty_id !== proposal.reason.replace(/^Verified bounty\s+/, '')) throw new Error('proposal/bounty mismatch');
  const {entry, ledger: nextLedger} = applyLedgerEntry({proposal, ledger});
  const recordedProposal = markProposalRecorded({proposal, entry});
  const recordedBounty = markBountyRecorded({bounty, proposal, entry});
  return {entry, ledger: nextLedger, proposal: recordedProposal, bounty: recordedBounty};
}

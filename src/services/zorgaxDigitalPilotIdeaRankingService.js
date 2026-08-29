'use strict';

const RANKING_VERSION = 'zorgax_life_idea_ranking_v1';

function text(value) { return String(value || '').trim(); }
function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function requireIdeas(ideas) {
  if (!Array.isArray(ideas)) throw new Error('ideas must be an array');
  if (ideas.length < 2 || ideas.length > 5) throw new Error('ideas must contain between 2 and 5 candidates');
  return ideas.map((idea, index) => {
    if (!idea || typeof idea !== 'object') throw new Error(`ideas[${index}] must be an object`);
    const title = text(idea.title);
    if (!title) throw new Error(`ideas[${index}].title is required`);
    return {
      candidateId: text(idea.candidateId) || `candidate-${index + 1}`,
      title,
      description: text(idea.description),
      targetCustomer: text(idea.targetCustomer),
      customerProblem: text(idea.customerProblem),
      valueProposition: text(idea.valueProposition),
      evidence: Array.isArray(idea.evidence) ? idea.evidence.map(text).filter(Boolean).slice(0, 10) : [],
      constraints: Array.isArray(idea.constraints) ? idea.constraints.map(text).filter(Boolean).slice(0, 10) : [],
      participantInterest: clamp(Number.isFinite(Number(idea.participantInterest)) ? Number(idea.participantInterest) : 50, 0, 100),
      buildEase: clamp(Number.isFinite(Number(idea.buildEase)) ? Number(idea.buildEase) : 50, 0, 100)
    };
  });
}

function scoreCandidate(candidate) {
  const clarity = [candidate.targetCustomer, candidate.customerProblem, candidate.valueProposition].filter(Boolean).length * 10;
  const evidenceScore = Math.min(candidate.evidence.length * 12, 36);
  const feasibility = Math.round(candidate.buildEase * 0.18);
  const interest = Math.round(candidate.participantInterest * 0.16);
  const constraintPenalty = Math.min(candidate.constraints.length * 5, 20);
  const score = clamp(clarity + evidenceScore + feasibility + interest - constraintPenalty, 0, 100);
  const weaknesses = [];
  if (!candidate.targetCustomer) weaknesses.push('Target customer is not defined.');
  if (!candidate.customerProblem) weaknesses.push('Customer problem is not defined.');
  if (!candidate.valueProposition) weaknesses.push('Value proposition is not defined.');
  if (!candidate.evidence.length) weaknesses.push('No real-world evidence has been recorded yet.');
  if (candidate.constraints.length) weaknesses.push('Known constraints should be tested before committing build effort.');
  return {
    ...candidate,
    score,
    scoreBreakdown: { clarity, evidence: evidenceScore, feasibility, participantInterest: interest, constraintPenalty },
    weaknesses,
    recommendation: score >= 70 ? 'VALIDATE_FIRST' : score >= 45 ? 'COLLECT_MORE_EVIDENCE' : 'REFINE_OR_REPLACE'
  };
}

function rankIdeas({ ideas, objective = '', weeklyCommitment = '' }) {
  const normalized = requireIdeas(ideas).map(scoreCandidate).sort((a, b) => b.score - a.score || a.candidateId.localeCompare(b.candidateId));
  return {
    version: RANKING_VERSION,
    objective: text(objective),
    weeklyCommitment: text(weeklyCommitment),
    candidates: normalized.map((item, index) => ({ ...item, rank: index + 1 })),
    recommendedCandidateId: normalized[0]?.candidateId || null,
    selectionRequired: true,
    selectedCandidateId: null,
    nextAction: 'Review the ranking, select one candidate explicitly, then move only that candidate into evidence-based validation.',
    advisoryOnly: true,
    requiresHumanApproval: true,
    executionPerformed: false,
    publicationPerformed: false,
    spendingPerformed: false,
    predictsSales: false,
    predictsProfit: false,
    caveat: 'The ranking is a decision aid based only on supplied information. It does not prove market demand or future commercial performance.'
  };
}

function selectCandidate({ ranking, candidateId }) {
  if (!ranking || !Array.isArray(ranking.candidates)) throw new Error('ranking is required');
  const normalizedId = text(candidateId);
  if (!normalizedId) throw new Error('candidateId is required');
  const selected = ranking.candidates.find((candidate) => candidate.candidateId === normalizedId);
  if (!selected) throw new Error('candidate not found in ranking');
  return {
    selectedCandidate: selected,
    humanSelected: true,
    readyForValidation: Boolean(selected.targetCustomer && selected.customerProblem && selected.valueProposition),
    advisoryOnly: true,
    requiresHumanApproval: true,
    executionPerformed: false
  };
}

module.exports = { RANKING_VERSION, rankIdeas, requireIdeas, scoreCandidate, selectCandidate };

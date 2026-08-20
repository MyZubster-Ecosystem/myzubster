const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Proposal = require('../models/Proposal');
const ZorgaxDaoDecision = require('../models/ZorgaxDaoDecision');

const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';
const SYSTEM_PROMPT_PATH = path.join(__dirname, '..', '..', '..', 'agents', 'zorgax', 'SYSTEM_PROMPT.md');

function clampConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0.5;
  return Math.max(0, Math.min(number, 1));
}

function cleanStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(item => typeof item === 'string' && item.trim())
    .map(item => item.trim().slice(0, 500))
    .slice(0, 8);
}

function parseDecision(raw) {
  const cleaned = String(raw || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const parsed = JSON.parse(cleaned);

  if (!['for', 'against', 'abstain'].includes(parsed.choice)) {
    throw new Error('Zorgax returned an invalid DAO choice');
  }
  if (!parsed.rationale || typeof parsed.rationale !== 'string') {
    throw new Error('Zorgax returned no rationale');
  }

  return {
    choice: parsed.choice,
    confidence: clampConfidence(parsed.confidence),
    rationale: parsed.rationale.trim().slice(0, 3000),
    risks: cleanStringArray(parsed.risks),
    conditions: cleanStringArray(parsed.conditions),
  };
}

function proposalSnapshot(proposal) {
  return {
    id: String(proposal._id),
    title: proposal.title,
    description: proposal.description,
    category: proposal.category,
    proposerId: proposal.proposerId,
    status: proposal.status,
    quorum: proposal.quorum,
    approvalThreshold: proposal.approvalThreshold,
    votingStartsAt: proposal.votingStartsAt,
    votingEndsAt: proposal.votingEndsAt,
    votesFor: proposal.votesFor,
    votesAgainst: proposal.votesAgainst,
    votesAbstain: proposal.votesAbstain,
    totalVotingPower: proposal.totalVotingPower,
    executionPayload: proposal.executionPayload,
  };
}

function digestSnapshot(snapshot) {
  return crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
}

router.get('/status', (_req, res) => {
  res.json({
    success: true,
    entityId: 'ZORGAX-001',
    role: 'advisory_ai_member',
    binding: false,
    votingWeight: 0,
    provider: 'ollama',
    model: OLLAMA_MODEL,
    policy: 'Zorgax may advise and record a position, but cannot cast token-weighted or treasury-binding votes.',
  });
});

router.get('/proposals/:id/decisions', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });

    const decisions = await ZorgaxDaoDecision.find({ proposalId: proposal._id }).sort({ updatedAt: -1 });
    return res.json({ success: true, proposalId: String(proposal._id), data: decisions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/proposals/:id/advise', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    if (!proposal) return res.status(404).json({ success: false, message: 'Proposal not found' });
    if (!['draft', 'active'].includes(proposal.status)) {
      return res.status(400).json({ success: false, message: 'Zorgax only advises on draft or active proposals' });
    }

    const snapshot = proposalSnapshot(proposal);
    const proposalDigest = digestSnapshot(snapshot);
    const persona = fs.readFileSync(SYSTEM_PROMPT_PATH, 'utf8');
    const governancePrompt = [
      persona,
      '',
      'DAO GOVERNANCE MODE',
      'You are an advisory AI member of the MyZubster DAO. Your decision is NON-BINDING and has zero token voting weight.',
      'Assess only the supplied proposal. Do not invent facts, balances, legal conclusions, consensus, or execution results.',
      'For treasury/funding proposals, be especially conservative about irreversible transfers and highlight missing safeguards.',
      'Return STRICT JSON only, with this schema:',
      '{"choice":"for|against|abstain","confidence":0.0,"rationale":"...","risks":["..."],"conditions":["..."]}',
      '',
      'PROPOSAL SNAPSHOT:',
      JSON.stringify(snapshot),
    ].join('\n');

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        messages: [{ role: 'system', content: governancePrompt }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        provider: 'ollama',
        message: 'Unable to obtain Zorgax advisory decision',
        error: data,
      });
    }

    let decision;
    try {
      decision = parseDecision(data.message?.content || '');
    } catch (err) {
      return res.status(502).json({ success: false, message: err.message });
    }

    const record = await ZorgaxDaoDecision.findOneAndUpdate(
      { proposalId: proposal._id, entityId: 'ZORGAX-001' },
      {
        $set: {
          choice: decision.choice,
          confidence: decision.confidence,
          rationale: decision.rationale,
          risks: decision.risks,
          conditions: decision.conditions,
          provider: 'ollama',
          model: OLLAMA_MODEL,
          proposalDigest,
        },
        $setOnInsert: {
          proposalId: proposal._id,
          entityId: 'ZORGAX-001',
          role: 'advisory_ai_member',
          binding: false,
          votingWeight: 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const commentText = [
      `[ZORGAX-001 advisory · NON-BINDING · weight 0] ${decision.choice.toUpperCase()} (confidence ${decision.confidence.toFixed(2)})`,
      decision.rationale,
      decision.risks.length ? `Risks: ${decision.risks.join('; ')}` : '',
      decision.conditions.length ? `Conditions: ${decision.conditions.join('; ')}` : '',
      `Proposal digest: ${proposalDigest}`,
    ].filter(Boolean).join('\n');

    const existingComment = proposal.comments.find(comment => comment.authorId === 'ZORGAX-001');
    if (existingComment) {
      existingComment.text = commentText.slice(0, 2000);
      existingComment.createdAt = new Date();
    } else {
      proposal.comments.push({ authorId: 'ZORGAX-001', text: commentText.slice(0, 2000) });
    }
    await proposal.save();

    return res.status(201).json({
      success: true,
      data: record,
      governance: {
        binding: false,
        votingWeight: 0,
        affectsTokenTally: false,
        humanRatificationRequired: true,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

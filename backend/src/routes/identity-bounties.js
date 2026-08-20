const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const IdentityBountySubmission = require('../models/IdentityBountySubmission');

const router = express.Router();

const BOUNTY = {
  key: 'identity-genesis-v0.1',
  title: 'Create your MyZubster identity + character',
  rewardAsset: 'MYZ',
  rewardAmount: Number(process.env.IDENTITY_BOUNTY_REWARD_MYZ || 100),
  rewardMeaning: 'Internal MyZubster reward/accounting units; not an external payment promise.',
  identityMode: 'account-unverified',
  requirements: [
    'Create a public-safe MyZubster profile.',
    'Create a narrative character with one supported archetype.',
    'Confirm the profile belongs to the submitting account/persona.',
    'Do not submit private keys, seed phrases, passwords, identity documents or other secrets.',
    'Accept human review before the reward can be recorded.'
  ]
};

const ARCHETYPES = new Set(['guardian', 'explorer', 'maker', 'chronicler', 'scientist']);
const FORBIDDEN_KEYS = new Set([
  'privatekey', 'private_key', 'seed', 'seedphrase', 'seed_phrase', 'mnemonic',
  'password', 'passwd', 'token', 'accesstoken', 'access_token', 'secret',
  'identitydocument', 'identity_document', 'passport', 'nationalid', 'national_id'
]);
const FORBIDDEN_TEXT_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\bseed phrase\b/i,
  /\bmnemonic phrase\b/i,
  /\bpassword\s*[:=]/i,
  /\baccess[_ -]?token\s*[:=]/i
];

function cleanText(value, maxLength = 500) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizeArchetype(value) {
  const archetype = cleanText(value, 20).toLowerCase();
  return ARCHETYPES.has(archetype) ? archetype : null;
}

function containsForbiddenPayload(value, path = '') {
  if (value === null || value === undefined) return null;

  if (typeof value === 'string') {
    if (FORBIDDEN_TEXT_PATTERNS.some((pattern) => pattern.test(value))) {
      return path || 'payload';
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const match = containsForbiddenPayload(value[index], `${path}[${index}]`);
      if (match) return match;
    }
    return null;
  }

  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      const normalized = key.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const childPath = path ? `${path}.${key}` : key;
      if (FORBIDDEN_KEYS.has(normalized)) return childPath;
      const match = containsForbiddenPayload(child, childPath);
      if (match) return match;
    }
  }

  return null;
}

function reviewerTokenMatches(provided) {
  const expected = process.env.IDENTITY_BOUNTY_REVIEW_TOKEN;
  if (!expected || !provided) return false;
  const left = crypto.createHash('sha256').update(String(provided)).digest();
  const right = crypto.createHash('sha256').update(String(expected)).digest();
  return crypto.timingSafeEqual(left, right);
}

function requireReviewer(req, res, next) {
  if (!process.env.IDENTITY_BOUNTY_REVIEW_TOKEN) {
    return res.status(503).json({
      success: false,
      error: 'Identity bounty review is disabled until IDENTITY_BOUNTY_REVIEW_TOKEN is configured.'
    });
  }

  if (!reviewerTokenMatches(req.get('x-myz-review-token'))) {
    return res.status(403).json({ success: false, error: 'Reviewer authorization required.' });
  }

  return next();
}

function publicSubmission(submission) {
  return {
    id: submission._id,
    bountyKey: submission.bountyKey,
    identityMode: submission.identityMode,
    publicProfile: submission.publicProfile,
    character: submission.character,
    checklist: submission.checklist,
    status: submission.status,
    reward: submission.reward,
    review: {
      decision: submission.review?.decision || 'none',
      notes: submission.review?.notes || '',
      reviewedAt: submission.review?.reviewedAt || null
    },
    submittedAt: submission.submittedAt,
    createdAt: submission.createdAt,
    updatedAt: submission.updatedAt
  };
}

function allChecklistItemsAccepted(checklist) {
  return Boolean(
    checklist?.confirmedOwnProfile &&
    checklist?.acceptedPublicProfileRules &&
    checklist?.acceptedNoSecrets &&
    checklist?.acceptedHumanReview
  );
}

router.get('/definition', (_req, res) => {
  res.json({
    success: true,
    bounty: BOUNTY,
    archetypes: Array.from(ARCHETYPES),
    verificationBoundary: 'Creating this profile does not verify a civil/legal identity or prove authorship/ownership outside MyZubster.'
  });
});

router.get('/stats', async (_req, res, next) => {
  try {
    const [total, review, rewarded] = await Promise.all([
      IdentityBountySubmission.countDocuments({ bountyKey: BOUNTY.key }),
      IdentityBountySubmission.countDocuments({ bountyKey: BOUNTY.key, status: 'review' }),
      IdentityBountySubmission.countDocuments({ bountyKey: BOUNTY.key, status: 'reward_recorded' })
    ]);

    return res.json({ success: true, bountyKey: BOUNTY.key, total, review, rewarded });
  } catch (error) {
    return next(error);
  }
});

router.post('/claim', async (req, res, next) => {
  try {
    const forbiddenPath = containsForbiddenPayload(req.body);
    if (forbiddenPath) {
      return res.status(400).json({
        success: false,
        error: `Sensitive/secret material is not accepted in identity bounty payloads (${forbiddenPath}).`
      });
    }

    const participantKey = cleanText(req.body?.participantKey, 96);
    const displayName = cleanText(req.body?.displayName, 40);
    const characterName = cleanText(req.body?.characterName, 40);
    const archetype = normalizeArchetype(req.body?.archetype);
    const bio = cleanText(req.body?.bio, 500);
    const requestedMyzId = cleanText(req.body?.requestedMyzId, 80) || null;
    const visualRef = cleanText(req.body?.visualRef, 500) || null;
    const checklist = req.body?.checklist || {};

    if (participantKey.length < 3 || displayName.length < 2 || characterName.length < 2 || !archetype) {
      return res.status(400).json({
        success: false,
        error: 'participantKey, displayName, characterName and a supported archetype are required.'
      });
    }

    const existing = await IdentityBountySubmission.findOne({
      bountyKey: BOUNTY.key,
      participantKey
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'This participant already has a submission for the current identity bounty.',
        submission: publicSubmission(existing)
      });
    }

    const submission = await IdentityBountySubmission.create({
      bountyKey: BOUNTY.key,
      participantKey,
      identityMode: 'account-unverified',
      publicProfile: { displayName, requestedMyzId, bio },
      character: { name: characterName, archetype, visualRef },
      checklist: {
        confirmedOwnProfile: Boolean(checklist.confirmedOwnProfile),
        acceptedPublicProfileRules: Boolean(checklist.acceptedPublicProfileRules),
        acceptedNoSecrets: Boolean(checklist.acceptedNoSecrets),
        acceptedHumanReview: Boolean(checklist.acceptedHumanReview)
      },
      status: 'draft',
      reward: {
        asset: 'MYZ',
        amount: BOUNTY.rewardAmount,
        status: 'not_eligible'
      }
    });

    return res.status(201).json({
      success: true,
      submission: publicSubmission(submission),
      note: 'The submission is a draft. Submit it for human review to become eligible for the MYZ reward.'
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, error: 'Duplicate identity bounty submission.' });
    }
    return next(error);
  }
});

router.post('/:id/update', async (req, res, next) => {
  try {
    const forbiddenPath = containsForbiddenPayload(req.body);
    if (forbiddenPath) {
      return res.status(400).json({ success: false, error: `Sensitive/secret material is not accepted (${forbiddenPath}).` });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid submission id.' });
    }

    const submission = await IdentityBountySubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found.' });

    const participantKey = cleanText(req.body?.participantKey, 96);
    if (!participantKey || participantKey !== submission.participantKey) {
      return res.status(403).json({ success: false, error: 'Participant key does not match this draft.' });
    }

    if (!['draft', 'changes_requested'].includes(submission.status)) {
      return res.status(409).json({ success: false, error: 'This submission cannot be edited in its current state.' });
    }

    if (req.body.displayName !== undefined) submission.publicProfile.displayName = cleanText(req.body.displayName, 40);
    if (req.body.bio !== undefined) submission.publicProfile.bio = cleanText(req.body.bio, 500);
    if (req.body.requestedMyzId !== undefined) submission.publicProfile.requestedMyzId = cleanText(req.body.requestedMyzId, 80) || null;
    if (req.body.characterName !== undefined) submission.character.name = cleanText(req.body.characterName, 40);
    if (req.body.archetype !== undefined) {
      const archetype = normalizeArchetype(req.body.archetype);
      if (!archetype) return res.status(400).json({ success: false, error: 'Unsupported archetype.' });
      submission.character.archetype = archetype;
    }
    if (req.body.visualRef !== undefined) submission.character.visualRef = cleanText(req.body.visualRef, 500) || null;
    if (req.body.checklist) {
      submission.checklist.confirmedOwnProfile = Boolean(req.body.checklist.confirmedOwnProfile);
      submission.checklist.acceptedPublicProfileRules = Boolean(req.body.checklist.acceptedPublicProfileRules);
      submission.checklist.acceptedNoSecrets = Boolean(req.body.checklist.acceptedNoSecrets);
      submission.checklist.acceptedHumanReview = Boolean(req.body.checklist.acceptedHumanReview);
    }

    submission.status = 'draft';
    submission.reward.status = 'not_eligible';
    submission.review.decision = 'none';
    submission.review.notes = '';
    submission.review.reviewer = null;
    submission.review.reviewedAt = null;
    await submission.save();

    return res.json({ success: true, submission: publicSubmission(submission) });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/submit', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid submission id.' });
    }

    const submission = await IdentityBountySubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found.' });

    const participantKey = cleanText(req.body?.participantKey, 96);
    if (!participantKey || participantKey !== submission.participantKey) {
      return res.status(403).json({ success: false, error: 'Participant key does not match this draft.' });
    }

    if (!['draft', 'changes_requested'].includes(submission.status)) {
      return res.status(409).json({ success: false, error: 'This submission is not ready to be submitted again.' });
    }

    if (!allChecklistItemsAccepted(submission.checklist)) {
      return res.status(400).json({ success: false, error: 'All privacy, ownership and review checklist items must be accepted.' });
    }

    submission.status = 'review';
    submission.reward.status = 'pending_review';
    submission.submittedAt = new Date();
    await submission.save();

    return res.json({
      success: true,
      submission: publicSubmission(submission),
      note: 'Human review is required. No reward has been recorded yet.'
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/review/queue', requireReviewer, async (_req, res, next) => {
  try {
    const submissions = await IdentityBountySubmission.find({
      bountyKey: BOUNTY.key,
      status: 'review'
    }).sort({ submittedAt: 1 }).limit(100);

    return res.json({
      success: true,
      count: submissions.length,
      submissions: submissions.map(publicSubmission)
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/review', requireReviewer, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid submission id.' });
    }

    const submission = await IdentityBountySubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found.' });
    if (submission.status !== 'review') {
      return res.status(409).json({ success: false, error: 'Only submissions in review can receive a decision.' });
    }

    const decision = cleanText(req.body?.decision, 32).toLowerCase();
    const notes = cleanText(req.body?.notes, 1000);
    const reviewer = cleanText(req.get('x-myz-reviewer') || 'manual-review', 80);

    if (!['approved', 'changes_requested', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'decision must be approved, changes_requested or rejected.' });
    }

    submission.review.decision = decision;
    submission.review.notes = notes;
    submission.review.reviewer = reviewer;
    submission.review.reviewedAt = new Date();

    if (decision === 'approved') {
      submission.status = 'reward_recorded';
      submission.reward.status = 'recorded';
      submission.reward.recordedAt = new Date();
      submission.reward.ledgerReference = `MYZ-IDB-${Date.now()}-${String(submission._id).slice(-8)}`;
    } else if (decision === 'changes_requested') {
      submission.status = 'changes_requested';
      submission.reward.status = 'not_eligible';
    } else {
      submission.status = 'rejected';
      submission.reward.status = 'cancelled';
    }

    await submission.save();

    return res.json({
      success: true,
      submission: publicSubmission(submission),
      rewardBoundary: 'A recorded MYZ reward is an internal accounting record, not an XMR/token transfer.'
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, error: 'Invalid submission id.' });
    }

    const submission = await IdentityBountySubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ success: false, error: 'Submission not found.' });

    return res.json({ success: true, submission: publicSubmission(submission) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

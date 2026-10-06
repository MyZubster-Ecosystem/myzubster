const CulturalContributorAttestation = require('../models/CulturalContributorAttestation');

const DIALOGUE_ID = '2026-09-diy-sound-system-dialogue';
const STATEMENT_VERSION = '1';
const STATEMENT = 'I confirm that I am the participant in the September 2026 MyZubster DIY cultural dialogue documented by MyZubster. I make this attestation only in my individual capacity.';

exports.getAttestation = async (req, res) => {
  try {
    const attestation = await CulturalContributorAttestation.findOne({ userId: req.user._id, dialogueId: DIALOGUE_ID }).lean();
    return res.json({ success: true, data: { dialogueId: DIALOGUE_ID, statementVersion: STATEMENT_VERSION, statement: STATEMENT, attestation } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Unable to read cultural contributor attestation' });
  }
};

exports.attest = async (req, res) => {
  try {
    const { confirm, individualCapacityOnly, noCollectiveRepresentation, noCollectiveEndorsement } = req.body || {};
    if (confirm !== true || individualCapacityOnly !== true || noCollectiveRepresentation !== true || noCollectiveEndorsement !== true) {
      return res.status(400).json({ success: false, message: 'Explicit confirmation of the statement and all boundaries is required' });
    }

    const existing = await CulturalContributorAttestation.findOne({ userId: req.user._id, dialogueId: DIALOGUE_ID });
    if (existing) return res.status(409).json({ success: false, message: 'This account has already attested to this dialogue' });

    const attestation = await CulturalContributorAttestation.create({
      userId: req.user._id,
      dialogueId: DIALOGUE_ID,
      statementVersion: STATEMENT_VERSION,
      statement: STATEMENT,
      acknowledgedBoundaries: { individualCapacityOnly, noCollectiveRepresentation, noCollectiveEndorsement }
    });

    return res.status(201).json({ success: true, data: attestation });
  } catch (error) {
    if (error && error.code === 11000) return res.status(409).json({ success: false, message: 'This account has already attested to this dialogue' });
    return res.status(500).json({ success: false, message: 'Unable to record cultural contributor attestation' });
  }
};

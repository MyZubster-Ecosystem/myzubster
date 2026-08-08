const CarbonCredit = require('../models/carbonCreditModel');
const { v4: uuidv4 } = require('uuid');

exports.createCredit = async (req, res) => {
  try {
    const {userId, creditType, amount, evidence, organization} = req.body;
    if (!userId || !creditType || !amount) return res.status(400).json({error: 'userId, creditType, amount required'});
    const c = new CarbonCredit({creditId: uuidv4().substring(0,12), userId, creditType, amount, evidence, organization});
    await c.save();
    res.status(201).json({message: 'Credit created', creditId: c.creditId, status: 'pending'});
  } catch (e) { res.status(500).json({error: e.message}); }
};

exports.getCredits = async (req, res) => {
  try {
    const {userId, status, type} = req.query;
    const filter = {};
    if (userId) filter.userId = userId;
    if (status) filter.status = status;
    if (type) filter.creditType = type;
    const credits = await CarbonCredit.find(filter).sort({createdAt: -1}).limit(100);
    res.json({count: credits.length, credits});
  } catch (e) { res.status(500).json({error: e.message}); }
};

exports.verifyCredit = async (req, res) => {
  try {
    const {verifiedBy, esgReport} = req.body;
    const c = await CarbonCredit.findOne({creditId: req.params.creditId});
    if (!c) return res.status(404).json({error: 'Not found'});
    c.verificationStatus = 'verified'; c.verifiedBy = verifiedBy||'admin'; c.verifiedAt = new Date();
    if (esgReport) c.esgReport = esgReport;
    await c.save();
    res.json({message: 'Credit verified', creditId: c.creditId});
  } catch (e) { res.status(500).json({error: e.message}); }
};

exports.retireCredit = async (req, res) => {
  try {
    const c = await CarbonCredit.findOne({creditId: req.params.creditId});
    if (!c) return res.status(404).json({error: 'Not found'});
    c.status = 'retired'; c.retiredAt = new Date(); await c.save();
    res.json({message: 'Credit retired'});
  } catch (e) { res.status(500).json({error: e.message}); }
};

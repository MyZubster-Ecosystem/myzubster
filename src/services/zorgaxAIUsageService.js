'use strict';

const ZorgaxAIUsage = require('../models/ZorgaxAIUsage');
const { estimateAstraCost } = require('./aiModelRouter');

function monthStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

async function getAstraMonthlySpend(date = new Date()) {
  const rows = await ZorgaxAIUsage.aggregate([
    { $match: { provider: 'openai', model: process.env.ZORGAX_ASTRA_MODEL || 'gpt-5.6-sol', createdAt: { $gte: monthStart(date) } } },
    { $group: { _id: null, total: { $sum: '$costUsd' } } }
  ]);
  return rows[0]?.total || 0;
}

async function recordAstraUsage({ inputTokens = 0, outputTokens = 0, requestId } = {}) {
  const costUsd = estimateAstraCost({ inputTokens, outputTokens });
  return ZorgaxAIUsage.create({
    provider: 'openai',
    model: process.env.ZORGAX_ASTRA_MODEL || 'gpt-5.6-sol',
    inputTokens,
    outputTokens,
    costUsd,
    requestId
  });
}

module.exports = { monthStart, getAstraMonthlySpend, recordAstraUsage };

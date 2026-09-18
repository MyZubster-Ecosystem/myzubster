'use strict';

const ZorgaxAIUsage = require('../models/ZorgaxAIUsage');
const ZorgaxAIBudget = require('../models/ZorgaxAIBudget');
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

function budgetKey(date = new Date()) {
  return `openai:${process.env.ZORGAX_ASTRA_MODEL || 'gpt-5.6-sol'}:${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`;
}

async function reserveAstraBudget({ amountUsd, budgetUsd, date = new Date() }) {
  const amount = Math.max(0, Number(amountUsd) || 0);
  const cap = Math.max(0, Number(budgetUsd) || 0);
  if (!amount || !cap || amount > cap) return null;
  const key = budgetKey(date);
  await ZorgaxAIBudget.updateOne({ key }, { $setOnInsert: { key, reservedUsd: 0, spentUsd: 0 } }, { upsert: true });
  return ZorgaxAIBudget.findOneAndUpdate(
    { key, $expr: { $lte: [{ $add: ['$reservedUsd', '$spentUsd', amount] }, cap] } },
    { $inc: { reservedUsd: amount }, $set: { updatedAt: new Date() } },
    { new: true }
  );
}

async function settleAstraBudget({ reservedUsd, actualUsd, date = new Date() }) {
  const reserved = Math.max(0, Number(reservedUsd) || 0);
  const actual = Math.max(0, Number(actualUsd) || 0);
  return ZorgaxAIBudget.findOneAndUpdate({ key: budgetKey(date), reservedUsd: { $gte: reserved } }, { $inc: { reservedUsd: -reserved, spentUsd: actual }, $set: { updatedAt: new Date() } }, { new: true });
}

async function releaseAstraBudget({ reservedUsd, date = new Date() }) {
  const reserved = Math.max(0, Number(reservedUsd) || 0);
  if (!reserved) return null;
  return ZorgaxAIBudget.findOneAndUpdate({ key: budgetKey(date), reservedUsd: { $gte: reserved } }, { $inc: { reservedUsd: -reserved }, $set: { updatedAt: new Date() } }, { new: true });
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

module.exports = { monthStart, budgetKey, getAstraMonthlySpend, reserveAstraBudget, settleAstraBudget, releaseAstraBudget, recordAstraUsage };

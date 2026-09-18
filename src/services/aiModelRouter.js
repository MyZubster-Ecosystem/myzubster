'use strict';

const DEFAULT_BUDGET_USD = 25;
const ASTRA_INPUT_PER_M = 4;
const ASTRA_OUTPUT_PER_M = 20;

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function estimateAstraCost({ inputTokens = 0, outputTokens = 0 } = {}) {
  return (inputTokens / 1_000_000) * ASTRA_INPUT_PER_M +
    (outputTokens / 1_000_000) * ASTRA_OUTPUT_PER_M;
}

function classifyTask(message, { useResearch = false } = {}) {
  const text = String(message || '').toLowerCase();
  const complexSignals = [
    'github', 'vercel', 'deploy', 'debug', 'codice', 'code', 'pull request',
    'ricerca', 'research', 'life', 'kpi', 'mrv', 'document', 'analizza',
    'workflow', 'browser', 'computer', 'automazione', 'automation'
  ];
  const hits = complexSignals.reduce((n, signal) => n + (text.includes(signal) ? 1 : 0), 0);
  return useResearch || hits >= 2 || text.length >= 2500 ? 'complex' : 'standard';
}

function selectModel({ message, useResearch = false, astraSpentUsd = 0 } = {}) {
  const budgetUsd = envNumber('ZORGAX_ASTRA_MONTHLY_BUDGET_USD', DEFAULT_BUDGET_USD);
  const openaiConfigured = Boolean(String(process.env.OPENAI_API_KEY || '').trim());
  const astraKillSwitch = String(process.env.ZORGAX_ASTRA_KILL_SWITCH || '').toLowerCase() === 'true';
  const astraEnabled = openaiConfigured && !astraKillSwitch;
  const tier = classifyTask(message, { useResearch });

  if (astraEnabled && tier === 'complex' && astraSpentUsd < budgetUsd) {
    return {
      provider: 'openai',
      model: process.env.ZORGAX_ASTRA_MODEL || 'gpt-5.6-sol',
      tier,
      budgetUsd,
      remainingBudgetUsd: Math.max(0, budgetUsd - astraSpentUsd)
    };
  }

  return {
    provider: 'ollama',
    model: process.env.OLLAMA_MODEL || 'qwen2.5:3b',
    tier,
    budgetUsd,
    remainingBudgetUsd: Math.max(0, budgetUsd - astraSpentUsd),
    fallbackReason: !openaiConfigured ? 'openai_key_missing' : astraKillSwitch ? 'astra_kill_switch' : tier !== 'complex' ? 'standard_task' : 'budget_exhausted'
  };
}

module.exports = { classifyTask, selectModel, estimateAstraCost };

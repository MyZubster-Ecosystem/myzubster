'use strict';

const DEFAULT_BUDGET_USD = 25;
const DEFAULT_OPENAI_MODEL = 'gpt-5.6-sol';
const MODEL_PRICING_USD_PER_M = {
  'gpt-5.6-sol': { input: 4, output: 20 },
  'gpt-5.6-terra': { input: 2, output: 12 },
  'gpt-5.6-luna': { input: 0.2, output: 1.2 }
};

function envNumber(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function estimateAstraCost({ inputTokens = 0, outputTokens = 0, model = process.env.ZORGAX_ASTRA_MODEL || DEFAULT_OPENAI_MODEL } = {}) {
  const pricing = MODEL_PRICING_USD_PER_M[model] || MODEL_PRICING_USD_PER_M[DEFAULT_OPENAI_MODEL];
  return (inputTokens / 1_000_000) * pricing.input +
    (outputTokens / 1_000_000) * pricing.output;
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

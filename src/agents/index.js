/**
 * MyZubster AI Agents - Backward compatibility re-export
 *
 * The agents have been moved to services/ai-automation/src/agents/.
 * This file preserves the original import path for backward compatibility.
 */

const AgentOrchestrator = require('../../services/ai-automation/src/agents/orchestrator/agentOrchestrator');
const LongTermMemory = require('../../services/ai-automation/src/agents/memory/longTermMemory');
const PlantAgent = require('../../services/ai-automation/src/agents/skills/plantAgent');
const PetAgent = require('../../services/ai-automation/src/agents/skills/petAgent');
const PaymentAgent = require('../../services/ai-automation/src/agents/skills/paymentAgent');
const VerificationAgent = require('../../services/ai-automation/src/agents/skills/verificationAgent');

module.exports = {
  AgentOrchestrator,
  LongTermMemory,
  PlantAgent,
  PetAgent,
  PaymentAgent,
  VerificationAgent
};

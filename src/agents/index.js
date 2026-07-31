/**
 * MyZubster AI Agents Index
 * 
 * This file exports all AI agents for the MyZubster system.
 * Agents are organized by functionality:
 * - PlantAgent: Plant identification and monitoring
 * - PetAgent: Animal/NFC tracking and health monitoring
 * - PaymentAgent: XMR transaction processing
 * - VerificationAgent: Community verification and voting
 * - NotificationAgent: Multi-channel notifications (Slack/Telegram)
 */

// Import agents
const PlantAgent = require('./skills/plantAgent');
const PetAgent = require('./skills/petAgent');
const PaymentAgent = require('./skills/paymentAgent');
const VerificationAgent = require('./skills/verificationAgent');
const NotificationAgent = require('./skills/notificationAgent');
const AgentOrchestrator = require('./orchestrator/agentOrchestrator');

// Export all agents
module.exports = {
  PlantAgent,
  PetAgent,
  PaymentAgent,
  VerificationAgent,
  NotificationAgent,
  AgentOrchestrator
};

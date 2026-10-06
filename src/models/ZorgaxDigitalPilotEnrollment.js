'use strict';

const crypto = require('crypto');
const mongoose = require('mongoose');

const ENROLLMENT_STATUSES = Object.freeze({
  INVITED: 'INVITED',
  ACCEPTED: 'ACCEPTED',
  ONBOARDING: 'ONBOARDING',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  DECLINED: 'DECLINED'
});

const digitalPilotEnrollmentSchema = new mongoose.Schema({
  enrollmentId: { type: String, required: true, unique: true, default: () => `zpe_${crypto.randomUUID()}` },
  ownerId: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: Object.values(ENROLLMENT_STATUSES), default: ENROLLMENT_STATUSES.INVITED, index: true },
  program: { type: String, default: 'LIFE', immutable: true },
  objective: { type: String, default: '', trim: true },
  weeklyCommitment: { type: String, default: '', trim: true },
  preferredProductType: { type: String, default: '', trim: true },
  firstProjectId: { type: String, default: null, trim: true },
  consent: {
    accepted: { type: Boolean, default: false },
    acceptedAt: { type: Date, default: null },
    version: { type: String, default: null }
  },
  advisoryOnly: { type: Boolean, default: true, immutable: true },
  humanApprovalRequired: { type: Boolean, default: true, immutable: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const ZorgaxDigitalPilotEnrollment = mongoose.models.ZorgaxDigitalPilotEnrollment ||
  mongoose.model('ZorgaxDigitalPilotEnrollment', digitalPilotEnrollmentSchema);

module.exports = { ENROLLMENT_STATUSES, ZorgaxDigitalPilotEnrollment };

const mongoose = require('mongoose');

const EVIDENCE_EVENT_TYPES = Object.freeze({
  MEASUREMENT_CAPTURED: 'MEASUREMENT_CAPTURED',
  REVIEW_RECORDED: 'REVIEW_RECORDED',
  RECOMMENDATION_PREPARED: 'RECOMMENDATION_PREPARED',
  OUTCOME_RECORDED: 'OUTCOME_RECORDED'
});

const evidenceAuditEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    eventType: {
      type: String,
      required: true,
      enum: Object.values(EVIDENCE_EVENT_TYPES),
      index: true
    },
    evidenceId: {
      type: String,
      required: true,
      index: true,
      trim: true
    },
    sourceId: {
      type: String,
      default: null,
      index: true,
      trim: true
    },
    observedAt: {
      type: Date,
      default: null,
      index: true
    },
    actorRef: {
      type: String,
      required: true,
      trim: true
    },
    integrityDigest: {
      type: String,
      default: null,
      trim: true
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  {
    timestamps: true,
    collection: 'evidence_audit_events'
  }
);

evidenceAuditEventSchema.index(
  { eventType: 1, observedAt: -1, createdAt: -1 },
  { name: 'evidence_audit_type_observed' }
);

evidenceAuditEventSchema.index(
  { evidenceId: 1, eventType: 1, createdAt: 1 },
  { name: 'evidence_audit_evidence_timeline' }
);

const appendOnlyError = () => new Error('EvidenceAuditEvent is append-only; mutation and deletion are prohibited');
for (const hook of [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete'
]) {
  evidenceAuditEventSchema.pre(hook, function blockMutation(next) {
    next(appendOnlyError());
  });
}

evidenceAuditEventSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = {
  EVIDENCE_EVENT_TYPES,
  EvidenceAuditEvent:
    mongoose.models.EvidenceAuditEvent ||
    mongoose.model('EvidenceAuditEvent', evidenceAuditEventSchema)
};

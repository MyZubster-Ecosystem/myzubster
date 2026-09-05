const mongoose = require('mongoose');

const passportEventSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['ACQUIRED', 'REUSED', 'REPAIRED', 'TRANSFERRED', 'RECYCLING_REQUESTED', 'RECYCLER_ACCEPTED', 'RECOVERED'],
    required: true
  },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  note: { type: String, default: '', maxlength: 1000 },
  evidenceUrl: { type: String, default: '', maxlength: 1000 },
  occurredAt: { type: Date, default: Date.now }
}, { _id: true });

const circularItemPassportSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceListing', required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceOrder', required: true, unique: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, required: true, index: true },
  state: {
    type: String,
    enum: ['IN_USE', 'REUSED', 'REPAIRED', 'TRANSFERRED', 'AWAITING_RECYCLING', 'AT_RECYCLER', 'RECOVERED'],
    default: 'IN_USE',
    index: true
  },
  recyclerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  events: { type: [passportEventSchema], default: [] }
}, { timestamps: true });

circularItemPassportSchema.index({ ownerId: 1, updatedAt: -1 });

module.exports = mongoose.models.CircularItemPassport || mongoose.model('CircularItemPassport', circularItemPassportSchema);

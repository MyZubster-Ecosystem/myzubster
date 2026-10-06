const mongoose = require('mongoose');

const culturalEventSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  culturalTags: [{ type: String, trim: true }],
  startsAt: { type: Date, required: true, index: true },
  endsAt: { type: Date },
  status: {
    type: String,
    enum: ['DRAFT', 'ORGANIZER_REVIEW', 'ANNOUNCED', 'ACTIVE', 'POSTPONED', 'CANCELLED', 'COMPLETED'],
    default: 'DRAFT',
    index: true
  },
  location: {
    mode: {
      type: String,
      enum: ['PUBLIC_VENUE', 'PUBLIC_MEETING_POINT', 'APPROXIMATE_AREA', 'AUTHORIZED_RELEASE', 'PRIVATE'],
      default: 'PRIVATE'
    },
    publicText: { type: String, default: '', trim: true },
    restrictedText: { type: String, default: '', trim: true, select: false },
    releaseAt: { type: Date },
    released: { type: Boolean, default: false }
  },
  modules: {
    sound: { type: Boolean, default: true },
    artists: { type: Boolean, default: true },
    flyer: { type: Boolean, default: true },
    telegram: { type: Boolean, default: false },
    welfare: { type: Boolean, default: true },
    hospitality: { type: Boolean, default: false },
    circularEconomy: { type: Boolean, default: true },
    culture: { type: Boolean, default: true }
  },
  publicInfo: {
    timetable: { type: String, default: '' },
    access: { type: String, default: '' },
    flyerUrl: { type: String, default: '' },
    lastOrganizerUpdate: { type: Date }
  }
}, { timestamps: true });

culturalEventSchema.index({ ownerId: 1, startsAt: -1 });

module.exports = mongoose.model('CulturalEvent', culturalEventSchema);

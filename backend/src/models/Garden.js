const mongoose = require('mongoose');

// Schema per il punto geografico (usato per l'indice 2dsphere)
const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere',
    },
  },
  { _id: false }
);

// Schema principale per Garden
const gardenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    gps: {
      type: pointSchema,
      required: true,
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indici per ricerca testuale e geospaziale
gardenSchema.index({ name: 'text', description: 'text', address: 'text' });
gardenSchema.index({ gps: '2dsphere' });

const Garden = mongoose.model('Garden', gardenSchema);

module.exports = Garden;

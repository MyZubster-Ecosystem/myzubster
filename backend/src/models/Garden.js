const mongoose = require('mongoose');

// Schema per il punto geografico (indice 2dsphere)
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
      required: [true, 'Il nome è obbligatorio'],
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
      required: [true, 'Le coordinate GPS sono obbligatorie'],
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
    geocoding: {
      displayName: { type: String, default: '' },
      importance: { type: Number, default: 0 },
    },
    // Aggiungi qui altri campi se necessario
  },
  { timestamps: true }
);

// Indici
gardenSchema.index({ gps: '2dsphere' });
gardenSchema.index({ name: 'text', description: 'text', address: 'text' });

module.exports = mongoose.model('Garden', gardenSchema);

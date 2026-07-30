const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
  species: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  commonName: {
    type: String,
    trim: true
  },
  indirizzo: {
    via: { type: String, trim: true },
    quartiere: { type: String, trim: true, index: true },
    citta: { type: String, trim: true, index: true },
    cap: { type: String, trim: true },
    regione: { type: String, trim: true },
    paese: { type: String, trim: true, default: 'Italia' },
    formatted: { type: String, trim: true }
  },
  gps: {
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 }
  },
  size: {
    type: String,
    enum: ['seedling', 'small', 'medium', 'large', 'ancient'],
    default: 'small'
  },
  age: { type: Number, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending',
    index: true
  },
  photos: [{ type: String }],
  owner: { type: String, trim: true },
  description: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indice geospaziale per ricerche per vicinanza
plantSchema.index({ 'gps': '2dsphere' });

// Indice composito per ricerca testuale
plantSchema.index({ 
  'indirizzo.quartiere': 'text', 
  'indirizzo.citta': 'text', 
  'indirizzo.via': 'text', 
  'indirizzo.regione': 'text',
  species: 'text',
  commonName: 'text'
});

plantSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Plant', plantSchema);

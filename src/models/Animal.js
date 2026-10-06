const mongoose = require('mongoose');

const PrivateLocationSchema = new mongoose.Schema({
  algorithm: { type: String, required: true, enum: ['aes-256-gcm'] },
  keyVersion: { type: String, required: true },
  iv: { type: String, required: true },
  authTag: { type: String, required: true },
  ciphertext: { type: String, required: true }
}, { _id: false });

const AnimalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  species: { type: String, required: true, trim: true },
  breed: { type: String, trim: true },
  age: { type: Number, min: 0 },
  owner: { type: String, required: true, trim: true },
  ownerEmail: { type: String, trim: true, lowercase: true },
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    lat: Number,
    lng: Number,
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    country: { type: String, trim: true },
    visibility: {
      type: String,
      enum: ['private', 'approximate', 'public'],
      default: 'private'
    },
    precision: {
      type: String,
      enum: ['hidden', 'approx-1km', 'exact'],
      default: 'hidden'
    },
    consentVersion: { type: String, trim: true },
    consentedAt: Date
  },
  privateLocation: { type: PrivateLocationSchema, select: false },
  verified: { type: Boolean, default: false },
  imageUrl: String,
  createdAt: { type: Date, default: Date.now }
});

AnimalSchema.index({ species: 1, createdAt: -1 });

module.exports = mongoose.model('Animal', AnimalSchema);

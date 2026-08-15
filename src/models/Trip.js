const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  escrowId: { 
    type: String, 
    ref: 'Escrow',
    required: false 
  },
  userId: { 
    type: String, 
    required: true 
  },
  distanceKm: { 
    type: Number, 
    required: true 
  },
  durationMin: { 
    type: Number, 
    default: 0 
  },
  startLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  endLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  rewardMYZ: { 
    type: Number, 
    default: 0 
  },
  bonusMYZ: { 
    type: Number, 
    default: 0 
  },
  totalMYZ: { 
    type: Number, 
    default: 0 
  },
  scooterId: { 
    type: String,
    default: 'UNKNOWN'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Trip', TripSchema);

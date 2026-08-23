const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  moneroWallet: {
    type: String,
    trim: true
  },
  communityProfile: {
    pgpPublicKey: { type: String, trim: true, maxlength: 20000 },
    tariWallet: { type: String, trim: true, maxlength: 300 },
    myzWallet: { type: String, trim: true, maxlength: 300 },
    displayLocation: { type: String, trim: true, maxlength: 160 },
    bio: { type: String, trim: true, maxlength: 1000 },
    seedExchangeEnabled: { type: Boolean, default: false },
    petCommunityEnabled: { type: Boolean, default: false },
    updatedAt: { type: Date }
  },
  github: {
    id: { type: String, sparse: true },
    login: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    profileUrl: { type: String, trim: true },
    verifiedAt: { type: Date }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

UserSchema.index({ 'github.id': 1 }, { unique: true, sparse: true });

// Hash password prima di salvare
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Metodo per confrontare le password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);

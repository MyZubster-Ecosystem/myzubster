const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const socialIdentitySchema = new mongoose.Schema({
  id: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  verifiedAt: { type: Date }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
  moneroWallet: { type: String, trim: true },
  communityProfile: {
    pgpPublicKey: { type: String, trim: true, maxlength: 20000 }, tariWallet: { type: String, trim: true, maxlength: 300 }, myzWallet: { type: String, trim: true, maxlength: 300 }, displayLocation: { type: String, trim: true, maxlength: 160 }, bio: { type: String, trim: true, maxlength: 1000 }, seedExchangeEnabled: { type: Boolean, default: false }, petCommunityEnabled: { type: Boolean, default: false }, updatedAt: { type: Date }
  },
  github: { id: { type: String, sparse: true }, login: { type: String, trim: true }, avatarUrl: { type: String, trim: true }, profileUrl: { type: String, trim: true }, verifiedAt: { type: Date } },
  socialIdentities: { google: socialIdentitySchema, github: socialIdentitySchema },
  zorgaxProfile: {
    archetype: { type: String, enum: ['guardian', 'builder', 'explorer', 'caretaker'], default: 'explorer' }, traits: [{ type: String, trim: true, maxlength: 80 }], summary: { type: String, trim: true, maxlength: 800 }, source: { type: String, enum: ['gmail-derived', 'gmail-auto-sync', 'manual'], default: 'manual' }, approvedAt: { type: Date }, updatedAt: { type: Date }
  },
  gmailProfileSync: {
    enabled: { type: Boolean, default: false }, refreshTokenEncrypted: { type: String, select: false }, consentedAt: { type: Date }, lastSyncedAt: { type: Date }, revokedAt: { type: Date }, historyWindowDays: { type: Number, default: 180, min: 30, max: 365 }, sampleSize: { type: Number, default: 30, min: 5, max: 50 }, lastStatus: { type: String, enum: ['never', 'ready', 'success', 'error', 'revoked'], default: 'never' }, lastError: { type: String, trim: true, maxlength: 300 }
  },
  isVerified: { type: Boolean, default: false }, createdAt: { type: Date, default: Date.now }, lastLogin: { type: Date }
});

UserSchema.index({ 'github.id': 1 }, { unique: true, sparse: true });
UserSchema.index({ 'socialIdentities.google.id': 1 }, { unique: true, sparse: true });
UserSchema.index({ 'socialIdentities.github.id': 1 }, { unique: true, sparse: true });
UserSchema.index({ 'gmailProfileSync.enabled': 1, 'gmailProfileSync.lastSyncedAt': 1 });

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try { const salt = await bcrypt.genSalt(10); this.password = await bcrypt.hash(this.password, salt); next(); }
  catch (error) { next(error); }
});
UserSchema.methods.comparePassword = async function(candidatePassword) { return bcrypt.compare(candidatePassword, this.password); };
module.exports = mongoose.model('User', UserSchema);

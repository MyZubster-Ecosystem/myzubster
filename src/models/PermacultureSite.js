const mongoose = require('mongoose');

const PrivateLocationSchema = new mongoose.Schema({
  algorithm: { type: String, required: true, enum: ['aes-256-gcm'] },
  keyVersion: { type: String, required: true },
  iv: { type: String, required: true },
  authTag: { type: String, required: true },
  ciphertext: { type: String, required: true }
}, { _id: false });

const LocationSchema = new mongoose.Schema({
  lat: Number,
  lng: Number,
  address: String,
  city: String,
  country: String,
  visibility: { type: String, enum: ['private', 'approximate', 'public'], default: 'private' },
  precision: { type: String, enum: ['hidden', 'approx-1km', 'exact'], default: 'hidden' },
  consentVersion: String,
  consentedAt: Date
}, { _id: false });

const PlanningProfileSchema = new mongoose.Schema({
  areaSqm: { type: Number, required: true, min: 1, max: 100000000 },
  climateZone: {
    type: String,
    required: true,
    enum: ['tropical', 'subtropical', 'mediterranean', 'temperate', 'continental', 'arid', 'cold', 'unknown']
  },
  soilTexture: {
    type: String,
    enum: ['sand', 'loam', 'clay', 'silt', 'peat', 'mixed', 'unknown'],
    default: 'unknown'
  },
  slope: {
    type: String,
    enum: ['flat', 'gentle', 'moderate', 'steep', 'unknown'],
    default: 'unknown'
  },
  waterSources: [{
    type: String,
    enum: ['rainwater', 'well', 'municipal', 'surface_water', 'greywater', 'none', 'unknown']
  }],
  goals: [{
    type: String,
    enum: [
      'food_production', 'biodiversity', 'water_resilience', 'soil_regeneration',
      'education', 'community', 'carbon_storage', 'seed_saving', 'habitat', 'livestock'
    ]
  }],
  constraints: [{
    type: String,
    enum: ['water_scarcity', 'erosion', 'wind', 'shade', 'frost', 'fire_risk', 'salinity', 'limited_access', 'none']
  }]
}, { _id: false });

const ZoneSchema = new mongoose.Schema({
  zone: { type: Number, required: true, min: 0, max: 5 },
  purpose: { type: String, required: true, maxlength: 240 },
  elements: [{ type: String, maxlength: 120 }],
  rationale: { type: String, maxlength: 500 }
}, { _id: false });

const AiPlanSchema = new mongoose.Schema({
  schemaVersion: { type: String, default: 'permaculture-plan-v1' },
  provider: { type: String, enum: ['ollama', 'rules'], required: true },
  model: String,
  generatedAt: { type: Date, required: true },
  inputCommitment: { type: String, required: true, match: /^[a-f0-9]{64}$/ },
  summary: { type: String, required: true, maxlength: 1000 },
  zones: { type: [ZoneSchema], default: [] },
  waterStrategy: [{ type: String, maxlength: 300 }],
  soilStrategy: [{ type: String, maxlength: 300 }],
  biodiversityStrategy: [{ type: String, maxlength: 300 }],
  risks: [{ type: String, maxlength: 300 }],
  humanReviewRequired: { type: Boolean, default: true }
}, { _id: false });

const NftSchema = new mongoose.Schema({
  state: { type: String, enum: ['none', 'prepared', 'simulated', 'minted'], default: 'none' },
  onChain: { type: Boolean, default: false },
  tokenId: String,
  metadataHash: { type: String, match: /^[a-f0-9]{64}$/ },
  metadata: mongoose.Schema.Types.Mixed,
  preparedAt: Date,
  transactionHash: String,
  chain: String,
  contractAddress: String
}, { _id: false });

const PermacultureSiteSchema = new mongoose.Schema({
  siteId: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  ownerId: { type: String, required: true, index: true },
  siteType: {
    type: String,
    enum: ['urban', 'rural', 'community', 'school', 'rooftop', 'research'],
    default: 'rural'
  },
  profile: { type: PlanningProfileSchema, required: true },
  location: { type: LocationSchema, default: undefined },
  privateLocation: { type: PrivateLocationSchema, select: false },
  isPublic: { type: Boolean, default: false, index: true },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
  aiPlans: { type: [AiPlanSchema], default: [] },
  nft: { type: NftSchema, default: () => ({ state: 'none', onChain: false }) },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

PermacultureSiteSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

PermacultureSiteSchema.index({ isPublic: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('PermacultureSite', PermacultureSiteSchema);

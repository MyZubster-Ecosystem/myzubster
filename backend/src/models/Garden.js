const mongoose = require('mongoose');

<<<<<<< HEAD
=======
const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },
  { _id: false }
);

>>>>>>> 6561d1d (feat: Geolocalizzazione bounty #17  Implementazione della funzionalità di geolocalizzazione per il bounty #17.  ## Novità - Modello Garden con indice 2dsphere (GeoJSON Point) e indice text - Integrazione OSM Nominatim per geocoding e reverse geocoding - Campo address per ogni garden - GET /api/gardens/search?q=... (ricerca testuale + fallback geocoding) - GET /api/gardens/nearby?lat=...&lng=...&radius=... (query geospaziali) - GET /api/gardens/geocode?q=... (utility di geocoding) - CRUD completo: POST, GET, GET/:id, PUT, DELETE /api/gardens - 36 test (coprono geocoding, search, nearby, CRUD, edge case)  Co-authored-by: CloudPaw-Master <cloud-orchestrator>)
const gardenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
<<<<<<< HEAD
      maxlength: 120,
=======
      index: true,
>>>>>>> 6561d1d (feat: Geolocalizzazione bounty #17  Implementazione della funzionalità di geolocalizzazione per il bounty #17.  ## Novità - Modello Garden con indice 2dsphere (GeoJSON Point) e indice text - Integrazione OSM Nominatim per geocoding e reverse geocoding - Campo address per ogni garden - GET /api/gardens/search?q=... (ricerca testuale + fallback geocoding) - GET /api/gardens/nearby?lat=...&lng=...&radius=... (query geospaziali) - GET /api/gardens/geocode?q=... (utility di geocoding) - CRUD completo: POST, GET, GET/:id, PUT, DELETE /api/gardens - 36 test (coprono geocoding, search, nearby, CRUD, edge case)  Co-authored-by: CloudPaw-Master <cloud-orchestrator>)
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
<<<<<<< HEAD
      required: true,
      trim: true,
      maxlength: 300,
    },
    neighborhood: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    coordinates: {
      lat: { type: Number, required: true, min: -90, max: 90 },
      lng: { type: Number, required: true, min: -180, max: 180 },
    },
    ownerId: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
=======
      trim: true,
      default: '',
      index: true,
    },
    gps: {
      type: pointSchema,
      required: true,
    },
    geocoding: {
      displayName: { type: String, default: '' },
      type: { type: String, default: '' },
      category: { type: String, default: '' },
      osmId: { type: String, default: '' },
      osmType: { type: String, default: '' },
      importance: { type: Number, default: 0 },
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'active',
      index: true,
    },
    photos: {
      type: [String],
      default: [],
    },
    ownerId: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
>>>>>>> 6561d1d (feat: Geolocalizzazione bounty #17  Implementazione della funzionalità di geolocalizzazione per il bounty #17.  ## Novità - Modello Garden con indice 2dsphere (GeoJSON Point) e indice text - Integrazione OSM Nominatim per geocoding e reverse geocoding - Campo address per ogni garden - GET /api/gardens/search?q=... (ricerca testuale + fallback geocoding) - GET /api/gardens/nearby?lat=...&lng=...&radius=... (query geospaziali) - GET /api/gardens/geocode?q=... (utility di geocoding) - CRUD completo: POST, GET, GET/:id, PUT, DELETE /api/gardens - 36 test (coprono geocoding, search, nearby, CRUD, edge case)  Co-authored-by: CloudPaw-Master <cloud-orchestrator>)
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

<<<<<<< HEAD
gardenSchema.index({ coordinates: '2dsphere' });
gardenSchema.index({ name: 'text', description: 'text', address: 'text', neighborhood: 'text', city: 'text' });
gardenSchema.index({ city: 1, neighborhood: 1 });
=======
// Virtual properties for backward compatibility (lat/lng access)
gardenSchema.virtual('lat').get(function () {
  return this.gps && this.gps.coordinates ? this.gps.coordinates[1] : undefined;
});

gardenSchema.virtual('lng').get(function () {
  return this.gps && this.gps.coordinates ? this.gps.coordinates[0] : undefined;
});

// Indice 2dsphere per query geospaziali
gardenSchema.index({ gps: '2dsphere' });

// Indice text per ricerca full-text
gardenSchema.index({ name: 'text', description: 'text', address: 'text' });
>>>>>>> 6561d1d (feat: Geolocalizzazione bounty #17  Implementazione della funzionalità di geolocalizzazione per il bounty #17.  ## Novità - Modello Garden con indice 2dsphere (GeoJSON Point) e indice text - Integrazione OSM Nominatim per geocoding e reverse geocoding - Campo address per ogni garden - GET /api/gardens/search?q=... (ricerca testuale + fallback geocoding) - GET /api/gardens/nearby?lat=...&lng=...&radius=... (query geospaziali) - GET /api/gardens/geocode?q=... (utility di geocoding) - CRUD completo: POST, GET, GET/:id, PUT, DELETE /api/gardens - 36 test (coprono geocoding, search, nearby, CRUD, edge case)  Co-authored-by: CloudPaw-Master <cloud-orchestrator>)

module.exports = mongoose.model('Garden', gardenSchema);

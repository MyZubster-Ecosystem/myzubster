#!/usr/bin/env node
require('dotenv').config();

const mongoose = require('mongoose');
const Plant = require('../src/models/Plant');
const { prepareLocation } = require('../src/services/locationPrivacyService');

async function main() {
  const apply = process.argv.includes('--apply');
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGODB_URI (or MONGO_URI) is required');
  if (!process.env.LOCATION_ENCRYPTION_KEY) throw new Error('LOCATION_ENCRYPTION_KEY is required');

  await mongoose.connect(mongoUri);
  const plants = await Plant.find({
    'location.lat': { $exists: true },
    privateLocation: { $exists: false }
  }).select('+privateLocation');

  console.log(`[privacy] legacy plant locations found: ${plants.length}`);
  console.log(`[privacy] mode: ${apply ? 'APPLY' : 'DRY RUN'}`);

  let migrated = 0;
  for (const plant of plants) {
    const source = plant.location && typeof plant.location.toObject === 'function'
      ? plant.location.toObject()
      : plant.location;
    const prepared = prepareLocation(source, { legacyMigration: true, forcePrivate: true });

    if (apply) {
      plant.location = prepared.publicLocation;
      plant.privateLocation = prepared.privateLocation;
      await plant.save();
    }
    migrated += 1;
  }

  console.log(`[privacy] ${apply ? 'migrated' : 'would migrate'}: ${migrated}`);
  await mongoose.disconnect();
}

main().catch(async error => {
  console.error(`[privacy] migration failed: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});

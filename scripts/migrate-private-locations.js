#!/usr/bin/env node
require('dotenv').config();

const mongoose = require('mongoose');
const Plant = require('../src/models/Plant');
const Animal = require('../src/models/Animal');
const UrbanGarden = require('../src/models/urbanGardenModel');
const { prepareLocation } = require('../src/services/locationPrivacyService');

async function migrateModel(Model, label, apply) {
  const records = await Model.find({
    privateLocation: { $exists: false },
    $or: [
      { 'location.lat': { $exists: true } },
      { 'location.lng': { $exists: true } },
      { 'location.address': { $type: 'string', $ne: '' } },
      { 'location.city': { $type: 'string', $ne: '' } }
    ]
  }).select('+privateLocation');

  console.log(`[privacy] legacy ${label} locations found: ${records.length}`);
  if (!apply) return records.length;

  for (const record of records) {
    const source = record.location && typeof record.location.toObject === 'function'
      ? record.location.toObject()
      : record.location;
    const prepared = prepareLocation(source, { legacyMigration: true, forcePrivate: true });
    record.location = prepared.publicLocation;
    record.privateLocation = prepared.privateLocation;
    if (Object.prototype.hasOwnProperty.call(record.toObject(), 'isPublic')) record.isPublic = false;
    await record.save();
  }
  return records.length;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGODB_URI (or MONGO_URI) is required');
  if (apply && !process.env.LOCATION_ENCRYPTION_KEY) throw new Error('LOCATION_ENCRYPTION_KEY is required with --apply');

  await mongoose.connect(mongoUri);
  console.log(`[privacy] mode: ${apply ? 'APPLY' : 'DRY RUN'}`);
  const counts = await Promise.all([
    migrateModel(Plant, 'plant', apply),
    migrateModel(Animal, 'animal', apply),
    migrateModel(UrbanGarden, 'urban garden', apply)
  ]);
  const total = counts.reduce((sum, count) => sum + count, 0);
  console.log(`[privacy] ${apply ? 'migrated' : 'would migrate'}: ${total}`);
  if (!apply) console.log('[privacy] no records changed; re-run with --apply after backup and review');
  await mongoose.disconnect();
}

main().catch(async error => {
  console.error(`[privacy] migration failed: ${error.message}`);
  await mongoose.disconnect().catch(() => {});
  process.exitCode = 1;
});

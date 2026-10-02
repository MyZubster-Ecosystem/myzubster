#!/usr/bin/env node
/**
 * DB index optimization for the hottest query paths (issue #99).
 * Idempotent: existing indexes are left untouched, missing collections are
 * skipped, failures are reported without aborting the whole run.
 *
 * Uses mongoose, which is already a project dependency.
 *
 * Run:
 *   MONGODB_URI=mongodb://127.0.0.1:27017/myzubster node scripts/optimizeIndexes.js
 */
'use strict';

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/myzubster';

// collection -> index specs covering listing/filter/sort hot paths.
const INDEX_PLAN = [
  {
    collection: 'bounties',
    specs: [
      { status: 1, createdAt: -1 },
      { assignee: 1 },
      { source: 1, syncedAt: -1 },
    ],
  },
  {
    collection: 'users',
    specs: [{ email: 1 }, { telegramId: 1 }, { referralCode: 1 }],
  },
  {
    collection: 'coupons',
    specs: [{ code: 1 }, { expiresAt: 1 }],
  },
  {
    collection: 'plants',
    specs: [{ ownerId: 1, plantedAt: -1 }],
  },
  {
    collection: 'animals',
    specs: [{ ownerId: 1 }],
  },
  {
    collection: 'trips',
    specs: [{ userId: 1, createdAt: -1 }],
  },
  {
    collection: 'carboncredits',
    specs: [{ ownerId: 1, createdAt: -1 }],
  },
  {
    collection: 'referrals',
    specs: [{ referrerId: 1, createdAt: -1 }],
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const db = mongoose.connection.db;
  const existing = new Set(
    (await db.listCollections().toArray()).map((c) => c.name)
  );

  for (const plan of INDEX_PLAN) {
    if (!existing.has(plan.collection)) {
      console.log(`[skip] ${plan.collection}: collection not found`);
      continue;
    }
    const col = db.collection(plan.collection);
    for (const spec of plan.specs) {
      const name = Object.entries(spec)
        .map(([field, dir]) => `${field}_${dir > 0 ? 'asc' : 'desc'}`)
        .join('__');
      try {
        await col.createIndex(spec, { name, background: true });
        console.log(`[ok]   ${plan.collection}: ${name}`);
      } catch (err) {
        console.warn(`[warn] ${plan.collection}: ${name} -> ${err.message}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('Index optimization complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

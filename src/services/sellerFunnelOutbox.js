'use strict';
// MYZ-1615: explicitly invoked worker; no scheduler, credentials or production writes on import.
const SellerFunnelOutbox = require('../models/SellerFunnelOutbox');
const { captureSellerEvent, publicationInsertId } = require('./sellerFunnelCapture');

async function enqueuePublishedListing({ listing, userId, plan }) {
  if (!listing || listing.status !== 'active' || !listing._id || !userId) return { skipped:true };
  const eventKey = publicationInsertId('marketplace_listing_published',String(listing._id));
  await SellerFunnelOutbox.updateOne(
    { eventKey },
    { $setOnInsert: {
      eventKey, event:'marketplace_listing_published', actorId:userId, listingId:listing._id,
      category:listing.category, currency:listing.currency, plan
    }},
    { upsert:true }
  );
  return { queued:true };
}

async function drainSellerFunnelOutbox({ limit = 20, now = new Date(), capture = captureSellerEvent } = {}) {
  const safeLimit = Math.max(1,Math.min(100,Number(limit)||20));
  const pending = await SellerFunnelOutbox.find({ state:'pending', nextAttemptAt:{$lte:now} }).sort({createdAt:1}).limit(safeLimit).lean();
  const summary = { attempted:0, delivered:0, deferred:0 };
  for (const entry of pending) {
    summary.attempted++;
    let result;
    try {
      result = await capture(entry.event,entry.actorId,{
        seller_plan:entry.plan, listing_category:entry.category, currency:entry.currency, source:'api'
      },{ listingId:String(entry.listingId) });
    } catch (_error) { result = {delivered:false}; }
    if (result?.delivered) {
      await SellerFunnelOutbox.updateOne({_id:entry._id,state:'pending'},{$set:{state:'delivered',deliveredAt:new Date()}});
      summary.delivered++;
    } else {
      // Exponential backoff with cap; skipped configuration remains pending.
      const attempts = (entry.attempts||0)+1;
      const delay = Math.min(3600,Math.pow(2,Math.min(attempts,10))*15);
      await SellerFunnelOutbox.updateOne({_id:entry._id,state:'pending'},{$set:{nextAttemptAt:new Date(now.getTime()+delay*1000)},$inc:{attempts:1}});
      summary.deferred++;
    }
  }
  return summary;
}
module.exports = { enqueuePublishedListing, drainSellerFunnelOutbox };

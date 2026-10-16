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
  const summary = { attempted:0, delivered:0, deferred:0 };
  for (let i=0; i<safeLimit; i++) {
    // Claim one event atomically; expired leases can be reclaimed by another worker.
    const entry = await SellerFunnelOutbox.findOneAndUpdate(
      { $or:[
        { state:'pending', nextAttemptAt:{$lte:now} },
        { state:'processing', leaseUntil:{$lte:now} }
      ]},
      { $set:{state:'processing',leaseUntil:new Date(now.getTime()+60000)} },
      {new:true,sort:{createdAt:1}}
    ).lean();
    if (!entry) break;
    summary.attempted++;
    let result;
    try {
      result = await capture(entry.event,entry.actorId,{
        seller_plan:entry.plan, listing_category:entry.category, currency:entry.currency, source:'api'
      },{ listingId:String(entry.listingId) });
    } catch (_error) { result = {delivered:false}; }
    if (result?.delivered) {
      await SellerFunnelOutbox.updateOne({_id:entry._id,state:'processing',leaseUntil:entry.leaseUntil},
        {$set:{state:'delivered',deliveredAt:new Date()},$unset:{leaseUntil:1}});
      summary.delivered++;
    } else {
      const attempts = (entry.attempts||0)+1;
      const delay = Math.min(3600,Math.pow(2,Math.min(attempts,10))*15);
      await SellerFunnelOutbox.updateOne({_id:entry._id,state:'processing',leaseUntil:entry.leaseUntil},
        {$set:{state:'pending',nextAttemptAt:new Date(now.getTime()+delay*1000)},$unset:{leaseUntil:1},$inc:{attempts:1}});
      summary.deferred++;
    }
  }
  return summary;
}
module.exports = { enqueuePublishedListing, drainSellerFunnelOutbox };

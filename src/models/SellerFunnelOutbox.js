'use strict';
// MYZ-1615: durable event outbox. No personal data or arbitrary payloads.
const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  eventKey: { type:String, required:true, unique:true, immutable:true },
  event: { type:String, required:true, enum:['marketplace_listing_published'] },
  actorId: { type:mongoose.Schema.Types.ObjectId, ref:'User', required:true },
  listingId: { type:mongoose.Schema.Types.ObjectId, ref:'MarketplaceListing', required:true },
  category: { type:String, required:true },
  currency: { type:String, required:true },
  plan: { type:String, required:true },
  state: { type:String, enum:['pending','processing','delivered'], default:'pending', index:true },
  attempts: { type:Number, default:0 },
  leaseUntil: { type:Date, default:null },
  nextAttemptAt: { type:Date, default:Date.now, index:true },
  deliveredAt: { type:Date, default:null }
}, {timestamps:true});
schema.index({state:1,nextAttemptAt:1});
module.exports = mongoose.models.SellerFunnelOutbox || mongoose.model('SellerFunnelOutbox',schema);

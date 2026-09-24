'use strict';

const mongoose = require('mongoose');

const SETTLEMENT_STATES = ['PENDING', 'VERIFIED', 'EXPIRED', 'REJECTED'];

const quoteSchema = new mongoose.Schema({
  denomination:{ type:String, default:'EUR' },
  amount:{ type:Number, required:true },
  cryptoAmount:{ type:String, required:true },
  eurPerCoin:{ type:Number, required:true },
  observedAt:{ type:Date, required:true },
  source:{ type:String, required:true },
  status:{ type:String, default:'QUOTED' }
}, { _id:false });

const settlementSchema = new mongoose.Schema({
  status:{ type:String, enum:SETTLEMENT_STATES, default:'PENDING', index:true },
  paymentReference:{ type:String, default:null, trim:true },
  submittedAt:{ type:Date, default:null },
  verifiedAt:{ type:Date, default:null },
  verifier:{ type:String, default:null },
  confirmations:{ type:Number, default:0 },
  nextCheckAt:{ type:Date, default:null },
  checkAttempts:{ type:Number, default:0 },
  lastError:{ type:String, default:null }
}, { _id:false });

const schema = new mongoose.Schema({
  intentId:{ type:String, required:true, unique:true, index:true, trim:true },
  ownerId:{ type:String, required:true, index:true, trim:true },
  plan:{ type:String, required:true, trim:true },
  asset:{ type:String, required:true, uppercase:true, trim:true },
  destination:{ type:String, required:true, trim:true },
  renewalOf:{ type:String, default:null },
  quote:{ type:quoteSchema, required:true },
  settlement:{ type:settlementSchema, default:()=>({}) },
  expiresAt:{ type:Date, required:true, index:true },
  consumedAt:{ type:Date, default:null }
}, { timestamps:true, collection:'zorgaxpaymentintents' });

schema.index(
  { 'settlement.paymentReference':1 },
  { unique:true, sparse:true, name:'uniq_zorgax_legacy_payment_reference' }
);

module.exports = mongoose.models.ZorgaxPaymentIntent || mongoose.model('ZorgaxPaymentIntent', schema);
module.exports.SETTLEMENT_STATES = SETTLEMENT_STATES;

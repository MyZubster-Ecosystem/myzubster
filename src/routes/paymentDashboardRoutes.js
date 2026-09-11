'use strict';

const express = require('express');
const jwt = require('jsonwebtoken');
const dashboard = require('../services/settlementDashboardService');
const { stripeFundingInputsProvider } = require('../services/paymentDashboardStripeProvider');
const { createControlledCheckout, verifyControlledCheckout } = require('../services/paymentDashboardCheckoutService');
const router = express.Router();
const FILTER_KEYS = ['q','status','program','account','from','to'];
const DEFAULT_PAYMENT_ADMIN_GITHUB_LOGINS = ['danielioni-creator'];
function readFilter(query={}){const filter={};for(const key of FILTER_KEYS){if(query[key]!==undefined&&query[key]!=='')filter[key]=query[key];}return filter;}
function auth(req,res,next){const h=req.header('Authorization')||'';const token=h.startsWith('Bearer ')?h.slice(7):null;if(!token)return res.status(401).json({error:'No token provided'});const secret=process.env.JWT_SECRET;if(!secret)return res.status(503).json({error:'Authentication is not configured'});try{req.user=jwt.verify(token,secret);return next();}catch(_){return res.status(401).json({error:'Invalid token'});}}
function githubLogin(user){const value=user?.github||user?.login||user?.username||'';return typeof value==='string'?value.trim().toLowerCase():'';}
function configuredPaymentAdmins(){const configured=String(process.env.PAYMENT_DASHBOARD_ADMIN_GITHUB_LOGINS||'').split(',').map(v=>v.trim().toLowerCase()).filter(Boolean);return new Set([...DEFAULT_PAYMENT_ADMIN_GITHUB_LOGINS,...configured]);}
function isAdminUser(user){return user?.role==='admin'||configuredPaymentAdmins().has(githubLogin(user));}
function admin(req,res,next){if(!isAdminUser(req.user))return res.status(403).json({error:'Admin required'});return next();}
function resolveAccountId(user){if(!user)return null;if(typeof user.accountId==='string'&&user.accountId)return user.accountId;const login=user.github||user.username||user.login;if(typeof login==='string'&&login)return `contributor:github:${login}`;if(user.userId)return `contributor:${user.userId}`;return null;}
function scopeItems(items,accountId){return accountId?items.filter(i=>i.accountId===accountId):items;}
function buildFor(req){const isAdmin=isAdminUser(req.user);const requested=typeof req.query.account==='string'&&req.query.account?req.query.account:null;return dashboard.buildDashboard({filter:readFilter(req.query),accountId:isAdmin?requested:resolveAccountId(req.user)});}
router.get('/summary',auth,(req,res)=>{try{const p=buildFor(req);if(!isAdminUser(req.user)){const a=resolveAccountId(req.user);p.layers.bounty_rewards.items=scopeItems(p.layers.bounty_rewards.items,a);p.layers.xmr_payouts.items=scopeItems(p.layers.xmr_payouts.items,a);}return res.json(p);}catch(e){return res.status(500).json({error:e.message});}});
router.get('/meta',auth,(req,res)=>{try{const p=buildFor(req);return res.json({generatedAt:p.generatedAt,live:p.live,policy:p.policy,sources:p.sources,warnings:p.warnings,integrity:p.integrity,configured:{fundingInputs:p.layers.funding_inputs.configured,conversion:p.layers.conversion.configured,escrow:p.layers.escrow.configured}});}catch(e){return res.status(500).json({error:e.message});}});
router.get('/balances',auth,(req,res)=>{try{return res.json(buildFor(req).balances);}catch(e){return res.status(500).json({error:e.message});}});
router.get('/funding-inputs/stripe',auth,admin,async(_req,res)=>{try{return res.json(await stripeFundingInputsProvider());}catch(e){return res.status(502).json({configured:true,provider:'stripe-readonly',items:[],error:e.message});}});
router.get('/checkout/stripe/verify',auth,admin,async(req,res)=>{try{return res.json(await verifyControlledCheckout(req.query.session_id));}catch(e){return res.status(400).json({error:e.message});}});
/* Controlled write: creates a hosted Checkout Session only. No refunds, transfers or payouts. */
router.post('/checkout/stripe',auth,admin,express.json({limit:'8kb'}),async(req,res)=>{try{const result=await createControlledCheckout({input:req.body,actor:req.user,idempotencyKey:req.header('Idempotency-Key')});return res.status(201).json(result);}catch(e){return res.status(400).json({error:e.message});}});
router.get('/funding-inputs',auth,admin,(req,res)=>{try{return res.json(buildFor(req).layers.funding_inputs);}catch(e){return res.status(500).json({error:e.message});}});
router.get('/available-balance',auth,admin,(req,res)=>{try{return res.json(buildFor(req).layers.available_balance);}catch(e){return res.status(500).json({error:e.message});}});
router.get('/conversion',auth,admin,(req,res)=>{try{return res.json(buildFor(req).layers.conversion);}catch(e){return res.status(500).json({error:e.message});}});
router.get('/escrow',auth,(req,res)=>{try{const l=buildFor(req).layers.escrow;return res.json(l.configured?l:{...l,items:[]});}catch(e){return res.status(500).json({error:e.message});}});
router.get('/bounties',auth,(req,res)=>{try{const l=buildFor(req).layers.bounty_rewards;if(!isAdminUser(req.user))l.items=scopeItems(l.items,resolveAccountId(req.user));return res.json(l);}catch(e){return res.status(500).json({error:e.message});}});
router.get('/payouts',auth,(req,res)=>{try{const l=buildFor(req).layers.xmr_payouts;if(!isAdminUser(req.user))l.items=scopeItems(l.items,resolveAccountId(req.user));return res.json(l);}catch(e){return res.status(500).json({error:e.message});}});
module.exports=router;
module.exports._internal={auth,admin,isAdminUser,githubLogin,configuredPaymentAdmins,readFilter,resolveAccountId,scopeItems};

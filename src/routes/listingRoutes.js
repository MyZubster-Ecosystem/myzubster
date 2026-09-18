const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MarketplaceListing = require('../models/MarketplaceListing');
const SellerMembership = require('../models/SellerMembership');
const MarketplaceCategoryProposal = require('../models/MarketplaceCategoryProposal');
const { authenticate } = require('../middleware/auth');
const { freeSellerPlan, canPublishCommercialListing } = require('../services/freeSellerPolicy');

const ALLOWED_CURRENCIES = new Set(['ETH', 'BTC', 'XMR', 'MYZ', 'TARI', 'BARTER', 'FREE']);
const ALLOWED_CATEGORIES = new Set(['health_products','electronics','kefir_culture_donation','seeds','plants','produce','tools','services','development_services','event_support','agriculture_support','arts','wellness','help_request','university_course','thesis_project','research_project','internship','volunteering','pet_adoption','pet_lost_found','pet_services']);

function containsPrivateKeyMaterial(value) { const text=String(value||'').toUpperCase(); return /PRIVATE KEY|BEGIN PGP PRIVATE|BEGIN OPENSSH PRIVATE|SEED PHRASE|MNEMONIC/.test(text); }
function isCommunityExchange(category, currency) { const normalized=String(currency||'').toUpperCase(); return category==='kefir_culture_donation' || (category==='seeds' && ['FREE','BARTER'].includes(normalized)); }
function categorySlug(value) { return String(value||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,80); }
async function activeSeller(userId) {
 const membership=await SellerMembership.findOne({ userId, status:'ACTIVE' }).lean();
 if(!membership)return null;
 if(membership.plan==='SELLER_FREE')return membership;
 if(membership.plan==='SELLER_MONTHLY' && (!membership.expiresAt || membership.expiresAt>new Date()))return membership;
 return null;
}
async function activeCommercialListingCount(userId) {
 return MarketplaceListing.countDocuments({
  ownerId:userId,
  status:'active',
  $nor:[
   { category:'kefir_culture_donation' },
   { category:'seeds', currency:{ $in:['FREE','BARTER'] } }
  ]
 });
}
async function commercialPublishDecision(userId) {
 const membership=await activeSeller(userId);
 if(!membership)return { allowed:false, reason:'SELLER_ACTIVATION_REQUIRED', membership:null };
 if(membership.plan==='SELLER_MONTHLY')return { allowed:true, membership, legacyPaid:true };
 const activeCommercialListings=await activeCommercialListingCount(userId);
 return { ...canPublishCommercialListing(membership, activeCommercialListings), membership, activeCommercialListings };
}

router.get('/categories', async (_req,res)=>{try{const approved=await MarketplaceCategoryProposal.find({status:'approved'}).select('name slug description').sort({name:1}).lean();res.json({success:true,standard:[...ALLOWED_CATEGORIES],custom:approved});}catch(_error){res.status(500).json({success:false,message:'Categorie non disponibili'});}});
router.post('/categories/propose',authenticate,async(req,res)=>{try{const name=String(req.body?.name||'').trim();const description=String(req.body?.description||'').trim();const slug=categorySlug(name);if(name.length<3||!slug)return res.status(400).json({success:false,message:'Inserisci un nome categoria valido'});if(ALLOWED_CATEGORIES.has(slug))return res.status(409).json({success:false,message:'Questa categoria esiste già'});const existing=await MarketplaceCategoryProposal.findOne({proposerId:req.userId,slug});if(existing)return res.status(409).json({success:false,message:'Hai già proposto questa categoria',proposal:existing});const proposal=await MarketplaceCategoryProposal.create({proposerId:req.userId,name,slug,description,status:'pending'});res.status(201).json({success:true,message:'Categoria proposta. Sarà utilizzabile dopo approvazione.',proposal});}catch(error){res.status(400).json({success:false,message:error.message||'Proposta categoria non creata'});}});
router.get('/categories/mine',authenticate,async(req,res)=>{try{const proposals=await MarketplaceCategoryProposal.find({proposerId:req.userId}).sort({createdAt:-1}).lean();res.json({success:true,proposals});}catch(_error){res.status(500).json({success:false,message:'Proposte non disponibili'});}});

router.get('/', async (req,res)=>{ try { const {category,currency,location}=req.query; const query={status:'active'}; if(category)query.category=category; if(currency)query.currency=String(currency).toUpperCase(); if(location)query.location={$regex:String(location).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'}; const listings=await MarketplaceListing.find(query).sort({createdAt:-1}).limit(200).lean(); res.json({success:true,count:listings.length,listings:listings.map(item=>({...item,id:String(item._id)}))}); } catch(_error){res.status(500).json({success:false,message:'Marketplace non disponibile'});} });
router.get('/mine',authenticate,async(req,res)=>{try{const listings=await MarketplaceListing.find({ownerId:req.userId}).sort({createdAt:-1}).lean();res.json({success:true,listings:listings.map(item=>({...item,id:String(item._id)}))});}catch(_error){res.status(500).json({success:false,message:'Impossibile recuperare i tuoi annunci'});}});
router.get('/profile/me',authenticate,async(req,res)=>{try{const user=await User.findById(req.userId).select('username moneroWallet communityProfile');if(!user)return res.status(404).json({success:false,message:'Utente non trovato'});res.json({success:true,profile:user});}catch(_error){res.status(500).json({success:false,message:'Errore nel recupero del profilo community'});}});
router.patch('/profile/me',authenticate,async(req,res)=>{try{const{pgpPublicKey='',tariWallet='',myzWallet='',displayLocation='',bio='',seedExchangeEnabled=false,petCommunityEnabled=false,kefirDonorEnabled=false}=req.body||{};if([pgpPublicKey,tariWallet,myzWallet,bio].some(containsPrivateKeyMaterial))return res.status(400).json({success:false,message:'Inserisci solo chiavi PGP pubbliche e indirizzi wallet pubblici. Seed phrase e chiavi private sono vietati.'});if(pgpPublicKey&&!String(pgpPublicKey).includes('BEGIN PGP PUBLIC KEY BLOCK'))return res.status(400).json({success:false,message:'La chiave PGP deve essere una chiave pubblica ASCII-armored.'});const user=await User.findByIdAndUpdate(req.userId,{$set:{communityProfile:{pgpPublicKey:String(pgpPublicKey).trim(),tariWallet:String(tariWallet).trim(),myzWallet:String(myzWallet).trim(),displayLocation:String(displayLocation).trim(),bio:String(bio).trim(),seedExchangeEnabled:Boolean(seedExchangeEnabled),petCommunityEnabled:Boolean(petCommunityEnabled),kefirDonorEnabled:Boolean(kefirDonorEnabled),updatedAt:new Date()}}},{new:true,runValidators:true}).select('username moneroWallet communityProfile');if(!user)return res.status(404).json({success:false,message:'Utente non trovato'});res.json({success:true,profile:user});}catch(error){res.status(400).json({success:false,message:error.message||'Profilo community non aggiornato'});}});

router.post('/create',authenticate,async(req,res)=>{try{
 const requestedCategory=String(req.body?.category||'');
 const requestedCurrency=String(req.body?.currency||(req.body?.exchangeMode==='gift'?'FREE':req.body?.exchangeMode==='barter'?'BARTER':'MYZ')).toUpperCase();
 const communityExchange=isCommunityExchange(requestedCategory,requestedCurrency);
 if(!communityExchange){
  const decision=await commercialPublishDecision(req.userId);
  if(!decision.allowed){
   if(decision.reason==='FREE_SELLER_ACTIVE_LISTING_LIMIT')return res.status(409).json({success:false,code:decision.reason,message:`Hai raggiunto il limite di ${decision.limit} annunci commerciali attivi del piano Seller Free. Metti in pausa o chiudi un annuncio prima di pubblicarne un altro.`,sellerPlan:freeSellerPlan(),activeCommercialListings:decision.activeCommercialListings,paymentRequired:false,automaticCharge:false});
   return res.status(402).json({success:false,code:'SELLER_MEMBERSHIP_REQUIRED',message:'Per pubblicare annunci commerciali attiva gratuitamente il profilo Seller.',sellerPlan:freeSellerPlan(),paymentRequired:false,paymentMethodRequired:false});
  }
 }
 const{title,category,price,currency,description,location,features,contact,stock,exchangeMode,species,variety,pet,kefir}=req.body||{};
 const normalizedCurrency=String(currency||(exchangeMode==='gift'?'FREE':exchangeMode==='barter'?'BARTER':'MYZ')).toUpperCase();
 if(!title||!category)return res.status(400).json({error:'Titolo e categoria sono obbligatori'});
 const approvedCustomCategory=!ALLOWED_CATEGORIES.has(category)?await MarketplaceCategoryProposal.exists({slug:category,status:'approved'}):true;
 if(!approvedCustomCategory)return res.status(400).json({error:'Categoria marketplace non supportata o non ancora approvata'});
 if(!ALLOWED_CURRENCIES.has(normalizedCurrency))return res.status(400).json({error:'Valuta/modalità non supportata'});
 if(!['FREE','BARTER'].includes(normalizedCurrency)&&(price===undefined||price===null||Number(price)<0))return res.status(400).json({error:'Prezzo non valido'});
 if(category.startsWith('pet_')&&pet?.sale===true)return res.status(400).json({error:'Il modulo pet supporta adozioni, smarriti/trovati e servizi; non la vendita diretta di animali.'});
 if(category==='kefir_culture_donation'&&!['FREE','BARTER'].includes(normalizedCurrency))return res.status(400).json({error:'Le colture di kefir possono essere pubblicate solo come dono gratuito o baratto non commerciale.'});
 if(category==='kefir_culture_donation'&&!['milk','water'].includes(kefir?.type))return res.status(400).json({error:'Indica kefir di latte oppure kefir d’acqua.'});
 if(category==='kefir_culture_donation'&&kefir?.safetyAcknowledged!==true)return res.status(400).json({error:'È richiesta la conferma dei limiti sanitari e di sicurezza.'});
 if([description,JSON.stringify(contact||{})].some(containsPrivateKeyMaterial))return res.status(400).json({error:'Non pubblicare seed phrase o chiavi private.'});
 const listing=await MarketplaceListing.create({ownerId:req.userId,ownerUsername:req.username||'',title:String(title).trim(),category,price:['FREE','BARTER'].includes(normalizedCurrency)?0:Number(price),currency:normalizedCurrency,exchangeMode:exchangeMode||(normalizedCurrency==='FREE'?'gift':normalizedCurrency==='BARTER'?'barter':'payment'),description:String(description||'').trim(),location:String(location||'').trim(),species:String(species||'').trim(),variety:String(variety||'').trim(),features:Array.isArray(features)?features.slice(0,20):[],contact:contact||{},pet:category.startsWith('pet_')?{name:String(pet?.name||'').trim(),species:String(pet?.species||'').trim(),age:String(pet?.age||'').trim(),adoptionOnly:category==='pet_adoption'}:null,kefir:category==='kefir_culture_donation'?{type:kefir.type,cultureAge:String(kefir.cultureAge||'').trim().slice(0,120),handlingNotes:String(kefir.handlingNotes||'').trim().slice(0,500),safetyAcknowledged:true,donationOnly:normalizedCurrency==='FREE'}:null,stock:Math.max(1,Number(stock)||1)});
 res.status(201).json({success:true,listing:{...listing.toObject(),id:String(listing._id)}});
}catch(error){res.status(400).json({success:false,message:error.message||'Annuncio non creato'});}});

router.patch('/:id/status',authenticate,async(req,res)=>{try{const status=String(req.body?.status||'');if(!['active','paused','closed'].includes(status))return res.status(400).json({error:'Stato non valido'});if(status==='active'){const existing=await MarketplaceListing.findOne({_id:req.params.id,ownerId:req.userId}).select('category currency status').lean();if(!existing)return res.status(404).json({error:'Annuncio non trovato'});const communityExchange=isCommunityExchange(existing.category,existing.currency);if(!communityExchange&&existing.status!=='active'){const decision=await commercialPublishDecision(req.userId);if(!decision.allowed){if(decision.reason==='FREE_SELLER_ACTIVE_LISTING_LIMIT')return res.status(409).json({success:false,code:decision.reason,message:`Hai raggiunto il limite di ${decision.limit} annunci commerciali attivi del piano Seller Free.`,sellerPlan:freeSellerPlan(),activeCommercialListings:decision.activeCommercialListings,paymentRequired:false,automaticCharge:false});return res.status(402).json({success:false,code:'SELLER_MEMBERSHIP_REQUIRED',message:'Attiva gratuitamente il profilo Seller prima di riattivare un annuncio commerciale.',sellerPlan:freeSellerPlan(),paymentRequired:false,paymentMethodRequired:false});}}}const listing=await MarketplaceListing.findOneAndUpdate({_id:req.params.id,ownerId:req.userId},{$set:{status}},{new:true,runValidators:true});if(!listing)return res.status(404).json({error:'Annuncio non trovato'});res.json({success:true,listing:{...listing.toObject(),id:String(listing._id)}});}catch(_error){res.status(400).json({success:false,message:'Impossibile aggiornare annuncio'});}});
router.delete('/:id',authenticate,async(req,res)=>{try{const listing=await MarketplaceListing.findOneAndDelete({_id:req.params.id,ownerId:req.userId});if(!listing)return res.status(404).json({error:'Annuncio non trovato'});res.json({success:true});}catch(_error){res.status(400).json({success:false,message:'Impossibile eliminare annuncio'});}});
router.get('/:id',async(req,res)=>{try{const listing=await MarketplaceListing.findOne({_id:req.params.id,status:'active'}).lean();if(!listing)return res.status(404).json({error:'Annuncio non trovato'});res.json({success:true,listing:{...listing,id:String(listing._id)}});}catch(_error){res.status(404).json({error:'Annuncio non trovato'});}});
module.exports=router;

const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const MarketplaceListing = require('../models/MarketplaceListing');
const SellerMembership = require('../models/SellerMembership');
const MarketplaceCategoryProposal = require('../models/MarketplaceCategoryProposal');
const MarketplaceUpload = require('../models/MarketplaceUpload');
const { authenticate, isAdmin } = require('../middleware/auth');
const { freeSellerPlan, canPublishCommercialListing } = require('../services/freeSellerPolicy');
const { validateImageBuffer, normalizeListingImages } = require('../services/imageValidationService');

const ALLOWED_CURRENCIES = new Set(['EUR', 'ETH', 'BTC', 'XMR', 'MYZ', 'TARI', 'BARTER', 'FREE']);
const ALLOWED_CATEGORIES = new Set(['health_products','electronics','kefir_culture_donation','seeds','plants','produce','clothing','accessories','event_equipment','tools','services','development_services','event_support','agriculture_support','art','arts','wellness','knowledge','help_request','university_course','thesis_project','research_project','internship','volunteering','pet_adoption','pet_lost_found','pet_services']);

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
async function activeCommercialListingCount(userId, session=null) {
 const query=MarketplaceListing.countDocuments({
  ownerId:userId,
  status:'active',
  $nor:[
   { category:'kefir_culture_donation' },
   { category:'seeds', currency:{ $in:['FREE','BARTER'] } }
  ]
 });
 return session?query.session(session):query;
}
async function commercialPublishDecision(userId) {
 const membership=await activeSeller(userId);
 if(!membership)return { allowed:false, reason:'SELLER_ACTIVATION_REQUIRED', membership:null };
 if(membership.plan==='SELLER_MONTHLY')return { allowed:true, membership, legacyPaid:true };
 const activeCommercialListings=await activeCommercialListingCount(userId);
 return { ...canPublishCommercialListing(membership, activeCommercialListings), membership, activeCommercialListings };
}

function sellerPolicyFailure(decision) {
 const error=new Error(decision.reason==='FREE_SELLER_ACTIVE_LISTING_LIMIT'?'Limite annunci Seller Free raggiunto':'Attivazione Seller richiesta');
 error.code=decision.reason;
 error.decision=decision;
 return error;
}

async function createCommercialListingTransaction(userId, listingData) {
 const session=await mongoose.startSession();
 let listing=null;
 try {
  await session.withTransaction(async()=>{
   const membership=await SellerMembership.findOne({userId,status:'ACTIVE'}).session(session);
   let decision;
   if(!membership){
    decision={allowed:false,reason:'SELLER_ACTIVATION_REQUIRED',membership:null};
   }else if(membership.plan==='SELLER_MONTHLY'&&(!membership.expiresAt||membership.expiresAt>new Date())){
    decision={allowed:true,membership,legacyPaid:true};
   }else if(membership.plan==='SELLER_FREE'){
    // Every quota-sensitive transaction writes the same membership document
    // before counting. Concurrent attempts therefore conflict and MongoDB
    // retries one transaction against the newly committed listing count.
    await SellerMembership.updateOne({_id:membership._id},{$inc:{listingQuotaVersion:1}},{session});
    const activeCommercialListings=await activeCommercialListingCount(userId,session);
    decision={...canPublishCommercialListing(membership,activeCommercialListings),membership,activeCommercialListings};
   }else{
    decision={allowed:false,reason:'SELLER_ACTIVATION_REQUIRED',membership};
   }
   if(!decision.allowed)throw sellerPolicyFailure(decision);
   [listing]=await MarketplaceListing.create([listingData],{session});
  });
  return listing;
 }finally{
  await session.endSession();
 }
}

router.get('/categories', async (_req,res)=>{try{const approved=await MarketplaceCategoryProposal.find({status:'approved'}).select('name slug description').sort({name:1}).lean();res.json({success:true,standard:[...ALLOWED_CATEGORIES],custom:approved});}catch(_error){res.status(500).json({success:false,message:'Categorie non disponibili'});}});
router.post('/categories/propose',authenticate,async(req,res)=>{try{const name=String(req.body?.name||'').trim();const description=String(req.body?.description||'').trim();const slug=categorySlug(name);if(name.length<3||!slug)return res.status(400).json({success:false,message:'Inserisci un nome categoria valido'});if(ALLOWED_CATEGORIES.has(slug))return res.status(409).json({success:false,message:'Questa categoria esiste già'});const existing=await MarketplaceCategoryProposal.findOne({proposerId:req.userId,slug});if(existing)return res.status(409).json({success:false,message:'Hai già proposto questa categoria',proposal:existing});const proposal=await MarketplaceCategoryProposal.create({proposerId:req.userId,name,slug,description,status:'pending'});res.status(201).json({success:true,message:'Categoria proposta. Sarà utilizzabile dopo approvazione.',proposal});}catch(error){res.status(400).json({success:false,message:error.message||'Proposta categoria non creata'});}});
router.get('/categories/mine',authenticate,async(req,res)=>{try{const proposals=await MarketplaceCategoryProposal.find({proposerId:req.userId}).sort({createdAt:-1}).lean();res.json({success:true,proposals});}catch(_error){res.status(500).json({success:false,message:'Proposte non disponibili'});}});
router.get('/categories/proposals',authenticate,isAdmin,async(_req,res)=>{try{const proposals=await MarketplaceCategoryProposal.find({}).sort({createdAt:-1}).limit(250).lean();res.json({success:true,proposals});}catch(_error){res.status(500).json({success:false,message:'Proposte categoria non disponibili'});}});
router.patch('/categories/proposals/:id',authenticate,isAdmin,async(req,res)=>{try{const status=String(req.body?.status||'').trim().toLowerCase();if(!['approved','rejected'].includes(status))return res.status(400).json({success:false,message:'Stato proposta non valido'});const proposal=await MarketplaceCategoryProposal.findByIdAndUpdate(req.params.id,{$set:{status}},{new:true,runValidators:true});if(!proposal)return res.status(404).json({success:false,message:'Proposta categoria non trovata'});res.json({success:true,proposal});}catch(error){res.status(400).json({success:false,message:error.message||'Proposta categoria non aggiornata'});}});

router.get('/', async (req,res)=>{ try { const {category,currency,location}=req.query; const query={status:'active'}; if(category)query.category=category; if(currency)query.currency=String(currency).toUpperCase(); if(location)query.location={$regex:String(location).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),$options:'i'}; const listings=await MarketplaceListing.find(query).sort({createdAt:-1}).limit(200).lean(); res.json({success:true,count:listings.length,listings:listings.map(item=>({...item,id:String(item._id)}))}); } catch(_error){res.status(500).json({success:false,message:'Marketplace non disponibile'});} });
router.get('/mine',authenticate,async(req,res)=>{try{const listings=await MarketplaceListing.find({ownerId:req.userId}).sort({createdAt:-1}).lean();res.json({success:true,listings:listings.map(item=>({...item,id:String(item._id)}))});}catch(_error){res.status(500).json({success:false,message:'Impossibile recuperare i tuoi annunci'});}});
router.get('/profile/me',authenticate,async(req,res)=>{try{const user=await User.findById(req.userId).select('username moneroWallet communityProfile');if(!user)return res.status(404).json({success:false,message:'Utente non trovato'});res.json({success:true,profile:user});}catch(_error){res.status(500).json({success:false,message:'Errore nel recupero del profilo community'});}});
router.patch('/profile/me',authenticate,async(req,res)=>{try{const{pgpPublicKey='',tariWallet='',myzWallet='',displayLocation='',bio='',seedExchangeEnabled=false,petCommunityEnabled=false,kefirDonorEnabled=false}=req.body||{};if([pgpPublicKey,tariWallet,myzWallet,bio].some(containsPrivateKeyMaterial))return res.status(400).json({success:false,message:'Inserisci solo chiavi PGP pubbliche e indirizzi wallet pubblici. Seed phrase e chiavi private sono vietati.'});if(pgpPublicKey&&!String(pgpPublicKey).includes('BEGIN PGP PUBLIC KEY BLOCK'))return res.status(400).json({success:false,message:'La chiave PGP deve essere una chiave pubblica ASCII-armored.'});const user=await User.findByIdAndUpdate(req.userId,{$set:{communityProfile:{pgpPublicKey:String(pgpPublicKey).trim(),tariWallet:String(tariWallet).trim(),myzWallet:String(myzWallet).trim(),displayLocation:String(displayLocation).trim(),bio:String(bio).trim(),seedExchangeEnabled:Boolean(seedExchangeEnabled),petCommunityEnabled:Boolean(petCommunityEnabled),kefirDonorEnabled:Boolean(kefirDonorEnabled),updatedAt:new Date()}}},{new:true,runValidators:true}).select('username moneroWallet communityProfile');if(!user)return res.status(404).json({success:false,message:'Utente non trovato'});res.json({success:true,profile:user});}catch(error){res.status(400).json({success:false,message:error.message||'Profilo community non aggiornato'});}});

const fs = require('fs');
const path = require('path');

const LOCAL_STORAGE_DIR = process.env.MARKETPLACE_UPLOAD_DIR || path.join(__dirname, '../../data/uploads/marketplace');

router.get('/images/:userId/:filename', (req, res) => {
  try {
    const { userId, filename } = req.params;
    if (!/^[a-zA-Z0-9_-]+$/.test(userId) || !/^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
      return res.status(400).json({ success: false, message: 'Parametri immagine non validi' });
    }

    const filePath = path.join(LOCAL_STORAGE_DIR, userId, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Immagine non trovata' });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeMap = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp'
    };

    res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filePath).pipe(res);
  } catch (_error) {
    res.status(500).json({ success: false, message: 'Errore nel recupero dell\'immagine' });
  }
});

let blobStorageClient = null;
try {
  blobStorageClient = require('@vercel/blob');
} catch (_) {
  blobStorageClient = null;
}

router.post('/images/upload', authenticate, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'], limit: '5mb' }), async (req, res) => {
  try {
    const seller = await activeSeller(req.userId);
    if (!seller) {
      return res.status(403).json({
        success: false,
        code: 'SELLER_REQUIRED',
        message: 'Il caricamento di immagini è riservato ai venditori attivi.'
      });
    }

    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      return res.status(400).json({ success: false, message: 'File immagine mancante o vuoto' });
    }

    const contentType = String(req.headers['content-type'] || '').split(';')[0];
    const validated = validateImageBuffer(req.body, contentType);

    let imageUrl;
    if (blobStorageClient && typeof blobStorageClient.put === 'function' && process.env.BLOB_READ_WRITE_TOKEN) {
      const ext = validated.extension;
      const blob = await blobStorageClient.put(
        `marketplace/${req.userId}/${Date.now()}.${ext}`,
        req.body,
        { access: 'public', addRandomSuffix: true, contentType: validated.mimeType }
      );
      imageUrl = blob.url;
    } else {
      // In serverless environments (production, Vercel preview, AWS Lambda), local filesystem is ephemeral.
      // If Blob storage credentials are missing in serverless environments, fail fast with 503 instead of creating broken ephemeral links.
      const isServerless = Boolean(
        process.env.VERCEL === '1' ||
        process.env.VERCEL_ENV ||
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env.LAMBDA_TASK_ROOT ||
        process.env.NODE_ENV === 'production'
      );
      if (isServerless) {
        return res.status(503).json({
          success: false,
          code: 'STORAGE_CONFIGURATION_ERROR',
          message: 'Lo storage persistente (@vercel/blob) non è configurato in ambiente serverless/produzione.'
        });
      }

      // Offline / local development / self-hosted persistence fallback
      const ext = validated.extension;
      const hash = crypto.createHash('sha256').update(req.body).digest('hex').slice(0, 16);
      const filename = `${Date.now()}-${hash}.${ext}`;
      const userDir = path.join(LOCAL_STORAGE_DIR, String(req.userId));
      await fs.promises.mkdir(userDir, { recursive: true });
      const filePath = path.join(userDir, filename);
      await fs.promises.writeFile(filePath, req.body);

      const host = req.get('host') || '127.0.0.1';
      const trustProxy = Boolean(req.app && typeof req.app.get === 'function' && req.app.get('trust proxy'));
      const isSecure = req.secure || (trustProxy && req.headers['x-forwarded-proto'] === 'https');
      const protocol = isSecure ? 'https' : 'http';
      imageUrl = `${protocol}://${host}/api/listings/images/${req.userId}/${filename}`;
    }

    try {
      await MarketplaceUpload.create({
        url: imageUrl,
        ownerId: req.userId,
        mimeType: validated.mimeType,
        format: validated.format,
        size: validated.size
      });
    } catch (_uploadRecordErr) {
      // Ignore duplicate or in-memory write issues
    }

    res.status(201).json({
      success: true,
      image: {
        url: imageUrl,
        format: validated.format,
        mimeType: validated.mimeType,
        size: validated.size
      }
    });
  } catch (error) {
    const statusCode = error.code === 'INVALID_IMAGE_MAGIC_BYTES' || error.code === 'MIME_TYPE_MISMATCH'
      ? 415
      : error.code === 'IMAGE_TOO_LARGE' || error.code === 'IMAGE_TOO_SMALL' || error.code === 'EMPTY_IMAGE_BUFFER'
        ? 400
        : 500;
    res.status(statusCode).json({
      success: false,
      code: error.code || 'IMAGE_UPLOAD_FAILED',
      message: error.message || 'Caricamento immagine fallito'
    });
  }
});

router.post('/create',authenticate,async(req,res)=>{try{
 const requestedCategory=String(req.body?.category||'');
 const requestedCurrency=String(req.body?.currency||(req.body?.exchangeMode==='gift'?'FREE':req.body?.exchangeMode==='barter'?'BARTER':'MYZ')).toUpperCase();
 const communityExchange=isCommunityExchange(requestedCategory,requestedCurrency);
 const{title,category,price,currency,description,location,features,contact,stock,exchangeMode,species,variety,pet,kefir,images}=req.body||{};
 const normalizedCurrency=String(currency||(exchangeMode==='gift'?'FREE':exchangeMode==='barter'?'BARTER':'MYZ')).toUpperCase();
 const verifiedUploads = await MarketplaceUpload.find({ ownerId: req.userId, status: 'active' }).select('url').lean();
 const verifiedUploadUrls = new Set(verifiedUploads.map(u => u.url));
 const normalizedImages=normalizeListingImages(images, title, { ownerId: req.userId, verifiedUploadUrls });
 if(!title||!category)return res.status(400).json({error:'Titolo e categoria sono obbligatori'});
 const usableCustomCategory=!ALLOWED_CATEGORIES.has(category)?await MarketplaceCategoryProposal.exists({slug:category,$or:[{status:'approved'},{status:'pending',proposerId:req.userId}]}):true;
 if(!usableCustomCategory)return res.status(400).json({error:'Categoria marketplace non supportata o non disponibile per questo account'});
 if(!ALLOWED_CURRENCIES.has(normalizedCurrency))return res.status(400).json({error:'Valuta/modalità non supportata'});
 if(!['FREE','BARTER'].includes(normalizedCurrency)&&(price===undefined||price===null||Number(price)<0))return res.status(400).json({error:'Prezzo non valido'});
 if(category.startsWith('pet_')&&pet?.sale===true)return res.status(400).json({error:'Il modulo pet supporta adozioni, smarriti/trovati e servizi; non la vendita diretta di animali.'});
 if(category==='kefir_culture_donation'&&!['FREE','BARTER'].includes(normalizedCurrency))return res.status(400).json({error:'Le colture di kefir possono essere pubblicate solo come dono gratuito o baratto non commerciale.'});
 if(category==='kefir_culture_donation'&&!['milk','water'].includes(kefir?.type))return res.status(400).json({error:'Indica kefir di latte oppure kefir d’acqua.'});
 if(category==='kefir_culture_donation'&&kefir?.safetyAcknowledged!==true)return res.status(400).json({error:'È richiesta la conferma dei limiti sanitari e di sicurezza.'});
 if([description,JSON.stringify(contact||{})].some(containsPrivateKeyMaterial))return res.status(400).json({error:'Non pubblicare seed phrase o chiavi private.'});
 const listingData={ownerId:req.userId,ownerUsername:req.username||'',title:String(title).trim(),category,price:['FREE','BARTER'].includes(normalizedCurrency)?0:Number(price),currency:normalizedCurrency,exchangeMode:exchangeMode||(normalizedCurrency==='FREE'?'gift':normalizedCurrency==='BARTER'?'barter':'payment'),description:String(description||'').trim(),images:normalizedImages,location:String(location||'').trim(),species:String(species||'').trim(),variety:String(variety||'').trim(),features:Array.isArray(features)?features.slice(0,20):[],contact:contact||{},pet:category.startsWith('pet_')?{name:String(pet?.name||'').trim(),species:String(pet?.species||'').trim(),age:String(pet?.age||'').trim(),adoptionOnly:category==='pet_adoption'}:null,kefir:category==='kefir_culture_donation'?{type:kefir.type,cultureAge:String(kefir.cultureAge||'').trim().slice(0,120),handlingNotes:String(kefir.handlingNotes||'').trim().slice(0,500),safetyAcknowledged:true,donationOnly:normalizedCurrency==='FREE'}:null,stock:Math.max(1,Number(stock)||1)};
 const listing=communityExchange?await MarketplaceListing.create(listingData):await createCommercialListingTransaction(req.userId,listingData);
 res.status(201).json({success:true,listing:{...listing.toObject(),id:String(listing._id)}});
}catch(error){
 if(error.code==='FREE_SELLER_ACTIVE_LISTING_LIMIT'){const decision=error.decision||{};return res.status(409).json({success:false,code:error.code,message:`Hai raggiunto il limite di ${decision.limit||freeSellerPlan().activeListingLimit} annunci commerciali attivi del piano Seller Free. Metti in pausa o chiudi un annuncio prima di pubblicarne un altro.`,sellerPlan:freeSellerPlan(),activeCommercialListings:decision.activeCommercialListings,paymentRequired:false,automaticCharge:false});}
 if(error.code==='SELLER_ACTIVATION_REQUIRED')return res.status(402).json({success:false,code:'SELLER_MEMBERSHIP_REQUIRED',message:'Per pubblicare annunci commerciali attiva gratuitamente il profilo Seller.',sellerPlan:freeSellerPlan(),paymentRequired:false,paymentMethodRequired:false});
 res.status(400).json({success:false,message:error.message||'Annuncio non creato'});
}});

router.patch('/:id',authenticate,async(req,res)=>{try{
 const listing=await MarketplaceListing.findOne({_id:req.params.id,ownerId:req.userId});
 if(!listing)return res.status(404).json({error:'Annuncio non trovato'});
 const nextCategory=req.body?.category!==undefined?String(req.body.category):listing.category;
 const nextCurrency=String(req.body?.currency!==undefined?req.body.currency:listing.currency).toUpperCase();
 const nextExchangeMode=req.body?.exchangeMode!==undefined?String(req.body.exchangeMode):listing.exchangeMode;
 const nextTitle=req.body?.title!==undefined?String(req.body.title).trim():listing.title;
 const nextDescription=req.body?.description!==undefined?String(req.body.description).trim():listing.description;
 const nextPrice=req.body?.price!==undefined?Number(req.body.price):listing.price;
 const searchable=(nextTitle+' '+nextDescription).toLowerCase();
 if(!nextTitle)return res.status(400).json({error:'Titolo obbligatorio'});
 if(/\\b(laser|visual|mapping|proiettore)\\b/i.test(searchable)&&nextCategory==='kefir_culture_donation')return res.status(400).json({error:'Un annuncio laser/visual non può usare la categoria kefir. Usa event_support.'});
 if(nextCategory==='kefir_culture_donation'&&!['FREE','BARTER'].includes(nextCurrency))return res.status(400).json({error:'Le colture di kefir possono essere pubblicate solo come dono gratuito o baratto non commerciale.'});
 if(nextCategory==='kefir_culture_donation'&&req.body?.kefir!==undefined&&!['milk','water'].includes(req.body.kefir?.type))return res.status(400).json({error:'Indica kefir di latte oppure kefir d’acqua.'});
 if(!['FREE','BARTER'].includes(nextCurrency)&&(!Number.isFinite(nextPrice)||nextPrice<0))return res.status(400).json({error:'Prezzo non valido'});
 if([nextDescription,JSON.stringify(req.body?.contact!==undefined?req.body.contact:listing.contact||{})].some(containsPrivateKeyMaterial))return res.status(400).json({error:'Non pubblicare seed phrase o chiavi private.'});
 const set={title:nextTitle,category:nextCategory,currency:nextCurrency,exchangeMode:nextExchangeMode,description:nextDescription,price:['FREE','BARTER'].includes(nextCurrency)?0:nextPrice};
 for(const field of ['location','features','contact','stock'])if(req.body?.[field]!==undefined)set[field]=req.body[field];
 if(req.body?.images!==undefined){
  const verifiedUploads = await MarketplaceUpload.find({ ownerId: req.userId, status: 'active' }).select('url').lean();
  const verifiedUploadUrls = new Set(verifiedUploads.map(u => u.url));
  set.images=normalizeListingImages(req.body.images,nextTitle, { ownerId: req.userId, verifiedUploadUrls });
 }
 if(nextCategory==='kefir_culture_donation'&&req.body?.kefir!==undefined)set.kefir={type:req.body.kefir.type,cultureAge:String(req.body.kefir.cultureAge||'').trim().slice(0,120),handlingNotes:String(req.body.kefir.handlingNotes||'').trim().slice(0,500),safetyAcknowledged:req.body.kefir.safetyAcknowledged===true,donationOnly:nextCurrency==='FREE'};
 if(nextCategory!=='kefir_culture_donation')set.kefir=null;
 const updated=await MarketplaceListing.findOneAndUpdate({_id:req.params.id,ownerId:req.userId},{$set:set},{new:true,runValidators:true});
 res.json({success:true,listing:{...updated.toObject(),id:String(updated._id)}});
}catch(error){res.status(400).json({success:false,message:error.message||'Impossibile modificare annuncio'});}});

router.patch('/:id/status',authenticate,async(req,res)=>{try{const status=String(req.body?.status||'');if(!['active','paused','closed'].includes(status))return res.status(400).json({error:'Stato non valido'});if(status==='active'){const existing=await MarketplaceListing.findOne({_id:req.params.id,ownerId:req.userId}).select('category currency status').lean();if(!existing)return res.status(404).json({error:'Annuncio non trovato'});const communityExchange=isCommunityExchange(existing.category,existing.currency);if(!communityExchange&&existing.status!=='active'){const decision=await commercialPublishDecision(req.userId);if(!decision.allowed){if(decision.reason==='FREE_SELLER_ACTIVE_LISTING_LIMIT')return res.status(409).json({success:false,code:decision.reason,message:`Hai raggiunto il limite di ${decision.limit} annunci commerciali attivi del piano Seller Free.`,sellerPlan:freeSellerPlan(),activeCommercialListings:decision.activeCommercialListings,paymentRequired:false,automaticCharge:false});return res.status(402).json({success:false,code:'SELLER_MEMBERSHIP_REQUIRED',message:'Attiva gratuitamente il profilo Seller prima di riattivare un annuncio commerciale.',sellerPlan:freeSellerPlan(),paymentRequired:false,paymentMethodRequired:false});}}}const listing=await MarketplaceListing.findOneAndUpdate({_id:req.params.id,ownerId:req.userId},{$set:{status}},{new:true,runValidators:true});if(!listing)return res.status(404).json({error:'Annuncio non trovato'});res.json({success:true,listing:{...listing.toObject(),id:String(listing._id)}});}catch(_error){res.status(400).json({success:false,message:'Impossibile aggiornare annuncio'});}});
router.delete('/:id',authenticate,async(req,res)=>{try{const listing=await MarketplaceListing.findOneAndDelete({_id:req.params.id,ownerId:req.userId});if(!listing)return res.status(404).json({error:'Annuncio non trovato'});res.json({success:true});}catch(_error){res.status(400).json({success:false,message:'Impossibile eliminare annuncio'});}});
router.get('/:id',async(req,res)=>{try{const listing=await MarketplaceListing.findOne({_id:req.params.id,status:'active'}).lean();if(!listing)return res.status(404).json({error:'Annuncio non trovato'});res.json({success:true,listing:{...listing,id:String(listing._id)}});}catch(_error){res.status(404).json({error:'Annuncio non trovato'});}});
module.exports=router;

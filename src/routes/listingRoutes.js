const express = require('express');
const router = express.Router();
const User = require('../models/User');
const MarketplaceListing = require('../models/MarketplaceListing');
const { authenticate } = require('../middleware/auth');

const ALLOWED_CURRENCIES = new Set(['ETH', 'BTC', 'XMR', 'MYZ', 'TARI', 'BARTER', 'FREE']);
const ALLOWED_CATEGORIES = new Set(['seeds','plants','produce','tools','services','volunteering','pet_adoption','pet_lost_found','pet_services']);

function containsPrivateKeyMaterial(value) {
  const text = String(value || '').toUpperCase();
  return /PRIVATE KEY|BEGIN PGP PRIVATE|BEGIN OPENSSH PRIVATE|SEED PHRASE|MNEMONIC/.test(text);
}

router.get('/', async (req, res) => {
  try {
    const { category, currency, location } = req.query;
    const query = { status: 'active' };
    if (category) query.category = category;
    if (currency) query.currency = String(currency).toUpperCase();
    if (location) query.location = { $regex: String(location).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    const listings = await MarketplaceListing.find(query).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, count: listings.length, listings: listings.map(item => ({ ...item, id: String(item._id) })) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Marketplace non disponibile' });
  }
});

router.get('/mine', authenticate, async (req, res) => {
  try {
    const listings = await MarketplaceListing.find({ ownerId: req.userId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, listings: listings.map(item => ({ ...item, id: String(item._id) })) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Impossibile recuperare i tuoi annunci' });
  }
});

router.get('/profile/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('username moneroWallet communityProfile');
    if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });
    res.json({ success: true, profile: user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore nel recupero del profilo community' });
  }
});

router.patch('/profile/me', authenticate, async (req, res) => {
  try {
    const { pgpPublicKey='', tariWallet='', myzWallet='', displayLocation='', bio='', seedExchangeEnabled=false, petCommunityEnabled=false } = req.body || {};
    if ([pgpPublicKey, tariWallet, myzWallet, bio].some(containsPrivateKeyMaterial)) return res.status(400).json({ success:false, message:'Inserisci solo chiavi PGP pubbliche e indirizzi wallet pubblici. Seed phrase e chiavi private sono vietati.' });
    if (pgpPublicKey && !String(pgpPublicKey).includes('BEGIN PGP PUBLIC KEY BLOCK')) return res.status(400).json({ success:false, message:'La chiave PGP deve essere una chiave pubblica ASCII-armored.' });
    const user = await User.findByIdAndUpdate(req.userId, { $set: { communityProfile: { pgpPublicKey:String(pgpPublicKey).trim(), tariWallet:String(tariWallet).trim(), myzWallet:String(myzWallet).trim(), displayLocation:String(displayLocation).trim(), bio:String(bio).trim(), seedExchangeEnabled:Boolean(seedExchangeEnabled), petCommunityEnabled:Boolean(petCommunityEnabled), updatedAt:new Date() } } }, { new:true, runValidators:true }).select('username moneroWallet communityProfile');
    if (!user) return res.status(404).json({ success:false, message:'Utente non trovato' });
    res.json({ success:true, profile:user });
  } catch (error) { res.status(400).json({ success:false, message:error.message || 'Profilo community non aggiornato' }); }
});

router.post('/create', authenticate, async (req, res) => {
  try {
    const { title, category, price, currency, description, location, features, contact, stock, exchangeMode, species, variety, pet } = req.body || {};
    const normalizedCurrency = String(currency || (exchangeMode === 'gift' ? 'FREE' : exchangeMode === 'barter' ? 'BARTER' : 'MYZ')).toUpperCase();
    if (!title || !category) return res.status(400).json({ error:'Titolo e categoria sono obbligatori' });
    if (!ALLOWED_CATEGORIES.has(category)) return res.status(400).json({ error:'Categoria marketplace non supportata' });
    if (!ALLOWED_CURRENCIES.has(normalizedCurrency)) return res.status(400).json({ error:'Valuta/modalità non supportata' });
    if (!['FREE','BARTER'].includes(normalizedCurrency) && (price === undefined || price === null || Number(price) < 0)) return res.status(400).json({ error:'Prezzo non valido' });
    if (category.startsWith('pet_') && pet?.sale === true) return res.status(400).json({ error:'Il modulo pet supporta adozioni, smarriti/trovati e servizi; non la vendita diretta di animali.' });
    if ([description, JSON.stringify(contact || {})].some(containsPrivateKeyMaterial)) return res.status(400).json({ error:'Non pubblicare seed phrase o chiavi private.' });
    const listing = await MarketplaceListing.create({ ownerId:req.userId, ownerUsername:req.username || '', title:String(title).trim(), category, price:['FREE','BARTER'].includes(normalizedCurrency)?0:Number(price), currency:normalizedCurrency, exchangeMode:exchangeMode || (normalizedCurrency==='FREE'?'gift':normalizedCurrency==='BARTER'?'barter':'payment'), description:String(description||'').trim(), location:String(location||'').trim(), species:String(species||'').trim(), variety:String(variety||'').trim(), features:Array.isArray(features)?features.slice(0,20):[], contact:contact||{}, pet:category.startsWith('pet_')?{ name:String(pet?.name||'').trim(), species:String(pet?.species||'').trim(), age:String(pet?.age||'').trim(), adoptionOnly:category==='pet_adoption' }:null, stock:Math.max(1,Number(stock)||1) });
    res.status(201).json({ success:true, listing:{ ...listing.toObject(), id:String(listing._id) } });
  } catch (error) { res.status(400).json({ success:false, message:error.message || 'Annuncio non creato' }); }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const status = String(req.body?.status || '');
    if (!['active','paused','closed'].includes(status)) return res.status(400).json({ error:'Stato non valido' });
    const listing = await MarketplaceListing.findOneAndUpdate({ _id:req.params.id, ownerId:req.userId }, { $set:{ status } }, { new:true, runValidators:true });
    if (!listing) return res.status(404).json({ error:'Annuncio non trovato' });
    res.json({ success:true, listing:{ ...listing.toObject(), id:String(listing._id) } });
  } catch (error) { res.status(400).json({ success:false, message:'Impossibile aggiornare annuncio' }); }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOneAndDelete({ _id:req.params.id, ownerId:req.userId });
    if (!listing) return res.status(404).json({ error:'Annuncio non trovato' });
    res.json({ success:true });
  } catch (error) { res.status(400).json({ success:false, message:'Impossibile eliminare annuncio' }); }
});

router.get('/:id', async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOne({ _id:req.params.id, status:'active' }).lean();
    if (!listing) return res.status(404).json({ error:'Annuncio non trovato' });
    res.json({ success:true, listing:{ ...listing, id:String(listing._id) } });
  } catch (error) { res.status(404).json({ error:'Annuncio non trovato' }); }
});

module.exports = router;

const express = require('express');
const MarketplaceListing = require('../models/MarketplaceListing');
const SellerMembership = require('../models/SellerMembership');

const router = express.Router();
const SUPPORTED = ['XMR', 'BTC', 'ETH'];
const NETWORKS = { XMR:'stagenet', BTC:'testnet', ETH:'sepolia' };

function normalizeAccepted(membership) {
  const values = Array.isArray(membership?.acceptedCryptoCurrencies) ? membership.acceptedCryptoCurrencies : ['XMR'];
  const accepted = [...new Set(values.map(value => String(value).toUpperCase()).filter(value => SUPPORTED.includes(value)))];
  return accepted.length ? accepted : ['XMR'];
}

router.get('/listings/:id/checkout-options', async (req, res) => {
  try {
    const listing = await MarketplaceListing.findOne({ _id:req.params.id, status:'active' }).lean();
    if (!listing) return res.status(404).json({ success:false, code:'LISTING_NOT_FOUND', message:'Annuncio non trovato' });
    if (['FREE','BARTER'].includes(String(listing.currency || '').toUpperCase())) {
      return res.json({ success:true, listingId:String(listing._id), paymentRequired:false, methods:[] });
    }

    if (String(listing.currency || '').toUpperCase() === 'MYZ') {
      return res.json({
        success:true,
        listingId:String(listing._id),
        sellerId:String(listing.ownerId),
        paymentRequired:true,
        acceptedCryptoCurrencies:[],
        defaultAsset:'MYZ',
        preferredSettlementCurrency:null,
        conversion:{ enabled:false, status:'NOT_APPLICABLE' },
        methods:[{
          asset:'MYZ',
          network:'internal-ledger',
          available:true,
          mode:'INTERNAL_LEDGER_TRANSFER',
          message:'Pagamento disponibile con crediti MYZ interni. Nessuna conversione fiat o crypto viene applicata.'
        }]
      });
    }

    const membership = await SellerMembership.findOne({ userId:listing.ownerId, status:'ACTIVE' }).lean();
    const accepted = normalizeAccepted(membership);
    const preferred = accepted.includes(membership?.preferredSettlementCurrency) ? membership.preferredSettlementCurrency : 'XMR';
    const methods = accepted.map(asset => ({
      asset,
      network:NETWORKS[asset],
      available:asset === 'XMR',
      mode:asset === 'XMR' ? 'DIRECT_VERIFIED_SETTLEMENT' : 'CHECKOUT_SELECTION_ONLY',
      message:asset === 'XMR'
        ? 'Pagamento XMR disponibile tramite il flusso di settlement verificato.'
        : `${asset} selezionabile dal checkout; settlement on-chain non ancora attivato.`
    }));

    res.json({
      success:true,
      listingId:String(listing._id),
      sellerId:String(listing.ownerId),
      paymentRequired:true,
      acceptedCryptoCurrencies:accepted,
      defaultAsset:accepted.includes('XMR') ? 'XMR' : accepted[0],
      preferredSettlementCurrency:preferred,
      conversion:{ enabled:false, status:'UNAVAILABLE' },
      methods
    });
  } catch (_error) {
    res.status(400).json({ success:false, code:'CHECKOUT_OPTIONS_UNAVAILABLE', message:'Opzioni di pagamento non disponibili' });
  }
});

router.post('/listings/:id/select-payment-method', async (req, res) => {
  try {
    const requested = String(req.body?.asset || 'XMR').toUpperCase();
    if (![...SUPPORTED, 'MYZ'].includes(requested)) return res.status(400).json({ success:false, code:'UNSUPPORTED_PAYMENT_ASSET', message:'Metodo di pagamento non supportato' });
    const listing = await MarketplaceListing.findOne({ _id:req.params.id, status:'active' }).lean();
    if (!listing) return res.status(404).json({ success:false, code:'LISTING_NOT_FOUND', message:'Annuncio non trovato' });
    const listingAsset = String(listing.currency || '').toUpperCase();
    if (listingAsset === 'MYZ') {
      if (requested !== 'MYZ') return res.status(409).json({ success:false, code:'LISTING_ASSET_MISMATCH', message:'Questo annuncio è prezzato esclusivamente in MYZ.' });
      return res.json({
        success:true,
        selectedAsset:'MYZ',
        network:'internal-ledger',
        mode:'INTERNAL_LEDGER_TRANSFER',
        conversionEnabled:false,
        nextStep:'PAY_ACCEPTED_ORDER_WITH_MYZ'
      });
    }
    if (requested === 'MYZ') {
      return res.status(409).json({ success:false, code:'LISTING_ASSET_MISMATCH', message:'MYZ può pagare solo annunci prezzati direttamente in MYZ; la conversione automatica è disabilitata.' });
    }
    const membership = await SellerMembership.findOne({ userId:listing.ownerId, status:'ACTIVE' }).lean();
    const accepted = normalizeAccepted(membership);
    if (!accepted.includes(requested)) return res.status(409).json({ success:false, code:'PAYMENT_METHOD_NOT_ACCEPTED', message:'Il Seller non accetta questa valuta' });
    if (requested !== 'XMR') {
      return res.status(503).json({
        success:false,
        code:'CRYPTO_SETTLEMENT_NOT_YET_AVAILABLE',
        selectedAsset:requested,
        network:NETWORKS[requested],
        conversionEnabled:false,
        message:`${requested} è configurato come scelta Marketplace ma il settlement verificato non è ancora attivo.`
      });
    }
    res.json({
      success:true,
      selectedAsset:'XMR',
      network:NETWORKS.XMR,
      mode:'DIRECT_VERIFIED_SETTLEMENT',
      conversionEnabled:false,
      nextStep:'USE_EXISTING_XMR_SETTLEMENT_FLOW'
    });
  } catch (_error) {
    res.status(400).json({ success:false, code:'PAYMENT_METHOD_SELECTION_FAILED', message:'Metodo di pagamento non selezionato' });
  }
});

module.exports = router;

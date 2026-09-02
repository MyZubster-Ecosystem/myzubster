const express = require('express');
const crypto = require('crypto');
const SellerMembership = require('../models/SellerMembership');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const monthlyPrice = () => Math.max(0, Number(process.env.MARKETPLACE_SELLER_MONTHLY_EUR || 9.90));

function requireModerator(req, res, next) {
  if (!['admin', 'moderator'].includes(req.userRole)) return res.status(403).json({ success:false, message:'Permessi insufficienti' });
  next();
}

function plan() {
  return {
    id: 'SELLER_MONTHLY',
    name: 'MyZubster Seller',
    amount: monthlyPrice(),
    currency: 'EUR',
    interval: 'month',
    benefits: ['pubblicazione annunci', 'gestione stock', 'richieste e messaggistica privata', 'reputazione da scambi completati'],
    paymentStatus: 'external_verification_required'
  };
}

router.get('/plan', (_req, res) => res.json({ success:true, plan:plan() }));

router.get('/me', authenticate, async (req, res) => {
  try {
    const membership = await SellerMembership.findOne({ userId:req.userId }).lean();
    const active = Boolean(membership && membership.status === 'ACTIVE' && membership.expiresAt && membership.expiresAt > new Date());
    res.json({ success:true, active, membership, plan:plan() });
  } catch (_error) { res.status(500).json({ success:false, message:'Stato Seller non disponibile' }); }
});

router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const amount = monthlyPrice();
    const billingReference = `SELLER-${crypto.randomUUID()}`;
    const membership = await SellerMembership.findOneAndUpdate(
      { userId:req.userId },
      { $set:{ plan:'SELLER_MONTHLY', status:'PENDING_PAYMENT', priceAmount:amount, priceCurrency:'EUR', billingReference, paymentReference:'', verifiedBy:null, verifiedAt:null } },
      { new:true, upsert:true, runValidators:true, setDefaultsOnInsert:true }
    );
    res.status(201).json({
      success:true,
      membership,
      plan:plan(),
      paymentRequired:true,
      message:'Richiesta Seller creata. L’account si attiva solo dopo verifica reale del pagamento; questa API non simula né conferma pagamenti.'
    });
  } catch (error) { res.status(400).json({ success:false, message:error.message || 'Richiesta Seller non creata' }); }
});

router.post('/cancel', authenticate, async (req, res) => {
  try {
    const membership = await SellerMembership.findOneAndUpdate({ userId:req.userId }, { $set:{ status:'CANCELLED', cancelledAt:new Date() } }, { new:true });
    if (!membership) return res.status(404).json({ success:false, message:'Account Seller non trovato' });
    res.json({ success:true, membership });
  } catch (_error) { res.status(400).json({ success:false, message:'Impossibile annullare il piano Seller' }); }
});

router.get('/moderation/pending', authenticate, requireModerator, async (_req, res) => {
  const memberships = await SellerMembership.find({ status:'PENDING_PAYMENT' }).sort({ createdAt:1 }).limit(200).lean();
  res.json({ success:true, memberships });
});

router.patch('/moderation/:userId/activate', authenticate, requireModerator, async (req, res) => {
  try {
    const paymentReference = String(req.body?.paymentReference || '').trim();
    if (!paymentReference || paymentReference.length < 4 || paymentReference.length > 300) return res.status(400).json({ success:false, message:'Riferimento pagamento verificato obbligatorio' });
    const now = new Date();
    const expiresAt = new Date(now); expiresAt.setMonth(expiresAt.getMonth() + 1);
    const membership = await SellerMembership.findOneAndUpdate(
      { userId:req.params.userId, status:'PENDING_PAYMENT' },
      { $set:{ status:'ACTIVE', paymentReference, verifiedBy:req.userId, verifiedAt:now, startsAt:now, expiresAt } },
      { new:true, runValidators:true }
    );
    if (!membership) return res.status(404).json({ success:false, message:'Richiesta Seller in attesa non trovata' });
    res.json({ success:true, membership, revenueRecorded:{ amount:membership.priceAmount, currency:membership.priceCurrency, basis:'payment_verified_by_authorized_moderator' } });
  } catch (error) { res.status(400).json({ success:false, message:error.message || 'Account Seller non attivato' }); }
});

module.exports = router;

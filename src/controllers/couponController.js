const githubController = require('./githubWebhookController');
const users = githubController.users || {};

const Coupon = require('../models/Coupon');

function generateCouponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return 'URBAN-' + code;
}

module.exports = {
  createCoupon: async (req, res) => {
    try {
      const { userId, discountType, discountValue, minMYZ, expiresInDays = 30 } = req.body;
      if (!userId || !discountType || !discountValue || !minMYZ) {
        return res.status(400).json({ error: 'Dati mancanti' });
      }
      const user = users[userId];
      if (!user) {
        return res.status(404).json({ error: 'Utente non trovato' });
      }
      if (user.myzBalance < minMYZ) {
        return res.status(400).json({ error: 'MYZ insufficienti' });
      }
      user.myzBalance -= minMYZ;
      const coupon = new Coupon({
        userId,
        code: generateCouponCode(),
        discountType,
        discountValue,
        minMYZ,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
        isActive: true
      });
      await coupon.save();
      res.status(201).json({
        success: true,
        coupon: { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, expiresAt: coupon.expiresAt },
        newBalance: user.myzBalance
      });
    } catch (error) {
      console.error('❌ Errore creazione coupon:', error);
      res.status(500).json({ error: 'Errore interno', details: error.message });
    }
  },
  redeemCoupon: async (req, res) => {
    try {
      const { code, userId } = req.body;
      if (!code || !userId) return res.status(400).json({ error: 'Codice e userId obbligatori' });
      const coupon = await Coupon.findOne({ code, isActive: true });
      if (!coupon) return res.status(404).json({ error: 'Coupon non valido o scaduto' });
      if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'Coupon già utilizzato' });
      if (new Date() > coupon.expiresAt) return res.status(400).json({ error: 'Coupon scaduto' });
      coupon.usedCount += 1;
      coupon.redeemedAt = new Date();
      if (coupon.usedCount >= coupon.maxUses) coupon.isActive = false;
      await coupon.save();
      res.json({ success: true, discount: { type: coupon.discountType, value: coupon.discountValue }, message: `Sconto applicato: ${coupon.discountValue} ${coupon.discountType === 'percentage' ? '%' : 'XMR'}` });
    } catch (error) {
      console.error('❌ Errore riscatto coupon:', error);
      res.status(500).json({ error: 'Errore interno', details: error.message });
    }
  },
  getUserCoupons: async (req, res) => {
    try {
      const { userId } = req.params;
      const coupons = await Coupon.find({ userId, isActive: true }).select('-__v');
      res.json({ success: true, coupons });
    } catch (error) {
      console.error('❌ Errore recupero coupon:', error);
      res.status(500).json({ error: 'Errore interno' });
    }
  }
};

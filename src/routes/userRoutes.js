const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { publicProfessionalProfile } = require('../services/professionalProfileService');

router.get('/:username/professional-profile', async (req, res) => {
  try {
    const username = String(req.params.username || '').trim();
    const user = await User.findOne({ username }).select('username professionalProfile');
    if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });

    const profile = publicProfessionalProfile(user.professionalProfile);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profilo professionale pubblico non disponibile' });
    }

    return res.json({
      success: true,
      data: {
        username: user.username,
        profile
      }
    });
  } catch (error) {
    console.error('Public professional profile error:', error);
    return res.status(500).json({ success: false, message: 'Impossibile leggere il profilo professionale pubblico' });
  }
});

router.get('/', (req, res) => res.json({ message: 'User routes - placeholder' }));
module.exports = router;

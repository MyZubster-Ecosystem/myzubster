const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { publicProfessionalProfile } = require('../services/professionalProfileService');

router.get('/github/:login/professional-profile', async (req, res) => {
  try {
    const login = String(req.params.login || '').trim().toLowerCase();
    if (!login) return res.status(400).json({ success: false, message: 'Login GitHub non valido' });

    const user = await User.findOne({ 'github.login': login }).select('username github professionalProfile');
    if (!user) return res.status(404).json({ success: false, message: 'Profilo pubblico non disponibile' });

    const profile = publicProfessionalProfile(user.professionalProfile);
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profilo professionale pubblico non disponibile' });
    }

    return res.json({
      success: true,
      data: {
        username: user.username,
        github: {
          login: user.github?.login || login,
          profileUrl: user.github?.profileUrl || ('https://github.com/' + login)
        },
        profile
      }
    });
  } catch (error) {
    console.error('Public professional profile by GitHub error:', error);
    return res.status(500).json({ success: false, message: 'Impossibile leggere il profilo professionale pubblico' });
  }
});

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

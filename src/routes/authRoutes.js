const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const authController = require('../controllers/authController');
const socialAuthController = require('../controllers/socialAuthController');
const emailProfileController = require('../controllers/emailProfileController');
const culturalContributorController = require('../controllers/culturalContributorController');
const zorgaxCulturalController = require('../controllers/zorgaxCulturalController');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

function legacyOrSocialCallback(provider, legacyHandler) {
  return (req, res, next) => {
    const decoded = jwt.decode(String(req.query?.state || ''));
    if (decoded?.purpose === 'social-login' && decoded?.provider === provider) {
      req.params.provider = provider;
      return socialAuthController.callback(req, res, next);
    }
    return legacyHandler(req, res, next);
  };
}

function validateRegistration(req, res, next) {
  const { username, email, password } = req.body || {};
  if (!String(username || '').trim() || !String(email || '').trim() || typeof password !== 'string' || !password) return res.status(400).json({ success: false, message: 'Username, email e password sono obbligatori' });
  if (password.length < 6) return res.status(400).json({ success: false, message: 'La password deve contenere almeno 6 caratteri' });
  return next();
}

router.post('/register', validateRegistration, authController.register);
router.post('/login', authController.login);
router.get('/github/start', authController.githubStart);
router.get('/github/callback', legacyOrSocialCallback('github', authController.githubCallback));
router.post('/github/verify-ticket', authController.githubVerifyTicket);
router.get('/social/providers', socialAuthController.providers);
router.get('/social/:provider/start', socialAuthController.start);
router.get('/social/:provider/callback', socialAuthController.callback);
router.post('/social/exchange-ticket', socialAuthController.exchangeTicket);
router.get('/gmail/start', emailProfileController.gmailStart);
router.get('/gmail/callback', legacyOrSocialCallback('google', emailProfileController.gmailCallback));
router.post('/gmail/verify-ticket', emailProfileController.verifyDraft);
router.get('/gmail/auto-sync/cron', emailProfileController.runAutoSync);
router.get('/profile', authenticate, authController.getProfile);
router.get('/github/public-snapshot', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('github');
    const login = String(user?.github?.login || '').trim();
    if (!login) return res.status(404).json({ success: false, message: 'Nessun profilo GitHub verificato collegato' });
    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'MyZubster-Zorgax' };
    const [profileRes, reposRes, readmeRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, { headers }),
      fetch(`https://api.github.com/users/${encodeURIComponent(login)}/repos?sort=updated&per_page=6&type=owner`, { headers }),
      fetch(`https://api.github.com/repos/${encodeURIComponent(login)}/${encodeURIComponent(login)}/readme`, { headers: { ...headers, Accept: 'application/vnd.github.raw+json' } })
    ]);
    if (!profileRes.ok) return res.status(502).json({ success: false, message: 'Profilo GitHub pubblico non disponibile' });
    const profile = await profileRes.json();
    const reposPayload = reposRes.ok ? await reposRes.json() : [];
    const repos = Array.isArray(reposPayload) ? reposPayload.map(repo => ({
      name: repo.name,
      description: repo.description || '',
      language: repo.language || '',
      stars: Number(repo.stargazers_count || 0),
      forks: Number(repo.forks_count || 0),
      url: repo.html_url,
      updatedAt: repo.updated_at
    })) : [];
    const readme = readmeRes.ok ? String(await readmeRes.text()).slice(0, 12000) : '';
    return res.json({
      success: true,
      data: {
        profile: {
          login: profile.login,
          name: profile.name || '',
          bio: profile.bio || '',
          company: profile.company || '',
          location: profile.location || '',
          blog: profile.blog || '',
          publicRepos: Number(profile.public_repos || 0),
          followers: Number(profile.followers || 0),
          following: Number(profile.following || 0),
          url: profile.html_url
        },
        repositories: repos,
        profileReadme: readme,
        source: 'github-public-api'
      }
    });
  } catch (error) {
    console.error('GitHub public snapshot error:', error);
    return res.status(500).json({ success: false, message: 'Impossibile leggere ora il profilo GitHub pubblico' });
  }
});
router.get('/cultural-contributor/attestation', authenticate, culturalContributorController.getAttestation);
router.post('/cultural-contributor/attestation', authenticate, culturalContributorController.attest);

// Zorgax cultural runtime: public reads never expose private event coordinates or account ownership.
router.post('/zorgax/events', authenticate, zorgaxCulturalController.createEvent);
router.get('/zorgax/events/:eventId', zorgaxCulturalController.getPublicEvent);
router.get('/zorgax/events/:eventId/manage', authenticate, zorgaxCulturalController.getOrganizerEvent);
router.patch('/zorgax/events/:eventId/manage', authenticate, zorgaxCulturalController.updateOrganizerEvent);
router.put('/zorgax/artists/me', authenticate, zorgaxCulturalController.upsertMyArtistProfile);
router.get('/zorgax/artists/search', zorgaxCulturalController.searchArtists);
router.get('/zorgax/artists/:profileId', zorgaxCulturalController.getArtistProfile);

router.post('/gmail/apply-profile', authenticate, emailProfileController.applyDraft);
router.post('/gmail/auto-sync/start-url', authenticate, emailProfileController.autoSyncStartUrl);
router.get('/gmail/auto-sync/status', authenticate, emailProfileController.autoSyncStatus);
router.delete('/gmail/auto-sync', authenticate, emailProfileController.disableAutoSync);
module.exports = router;

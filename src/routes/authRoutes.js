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
const { decryptToken, updateProfile, updateBio, getProfileReadme, updateProfileReadme, deleteProfileReadme } = require('../services/githubProfileAutomation');
const { normalizeProfessionalProfile, validateProfessionalProfile } = require('../services/professionalProfileService');

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

    const minimal = () => ({
      success: true,
      data: {
        profile: {
          login,
          name: '',
          bio: '',
          company: '',
          location: '',
          blog: '',
          publicRepos: 0,
          followers: 0,
          following: 0,
          url: user.github.profileUrl || `https://github.com/${login}`
        },
        repositories: [],
        profileReadme: '',
        capturedAt: user.github.verifiedAt || null,
        source: 'github-verified-identity-minimal',
        partial: true
      }
    });

    const cached = user.github?.publicSnapshot;
    if (cached?.capturedAt) {
      return res.json({
        success: true,
        data: {
          profile: {
            login,
            name: cached.name || '',
            bio: cached.bio || '',
            company: cached.company || '',
            location: cached.location || '',
            blog: cached.blog || '',
            publicRepos: Number(cached.publicRepos || 0),
            followers: Number(cached.followers || 0),
            following: Number(cached.following || 0),
            url: user.github.profileUrl || `https://github.com/${login}`
          },
          repositories: Array.isArray(cached.repositories) ? cached.repositories : [],
          profileReadme: cached.profileReadme || '',
          capturedAt: cached.capturedAt,
          source: 'github-oauth-cache',
          partial: false
        }
      });
    }

    const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'MyZubster-Zorgax' };
    const [profileRes, reposRes, readmeRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(login)}`, { headers }),
      fetch(`https://api.github.com/users/${encodeURIComponent(login)}/repos?sort=updated&per_page=6&type=owner`, { headers }),
      fetch(`https://api.github.com/repos/${encodeURIComponent(login)}/${encodeURIComponent(login)}/readme`, { headers: { ...headers, Accept: 'application/vnd.github.raw+json' } })
    ]);
    if (!profileRes.ok) return res.json(minimal());
    const profile = await profileRes.json();
    const reposPayload = reposRes.ok ? await reposRes.json() : [];
    const repositories = Array.isArray(reposPayload) ? reposPayload.map(repo => ({
      name: repo.name,
      description: repo.description || '',
      language: repo.language || '',
      stars: Number(repo.stargazers_count || 0),
      forks: Number(repo.forks_count || 0),
      url: repo.html_url,
      updatedAt: repo.updated_at
    })) : [];
    const profileReadme = readmeRes.ok ? String(await readmeRes.text()).slice(0, 12000) : '';

    user.github.publicSnapshot = {
      name: profile.name || '',
      bio: profile.bio || '',
      company: profile.company || '',
      location: profile.location || '',
      blog: profile.blog || '',
      publicRepos: Number(profile.public_repos || 0),
      followers: Number(profile.followers || 0),
      following: Number(profile.following || 0),
      repositories,
      profileReadme,
      capturedAt: new Date()
    };
    await user.save();

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
        repositories,
        profileReadme,
        capturedAt: user.github.publicSnapshot.capturedAt,
        source: 'github-public-api',
        partial: false
      }
    });
  } catch (error) {
    console.error('GitHub public snapshot error:', error);
    try {
      const user = await User.findById(req.userId).select('github');
      const login = String(user?.github?.login || '').trim();
      if (login) {
        return res.json({
          success: true,
          data: {
            profile: { login, name: '', bio: '', company: '', location: '', blog: '', publicRepos: 0, followers: 0, following: 0, url: user.github.profileUrl || `https://github.com/${login}` },
            repositories: [],
            profileReadme: '',
            capturedAt: user.github.verifiedAt || null,
            source: 'github-verified-identity-minimal',
            partial: true
          }
        });
      }
    } catch (_) {}
    return res.status(500).json({ success: false, message: 'Impossibile leggere ora il profilo GitHub pubblico' });
  }
});
router.get('/github/automation/status', authenticate, async (req, res) => {
  const user = await User.findById(req.userId).select('github githubAutomation');
  return res.json({ success: true, data: { linked: Boolean(user?.github?.login), login: user?.github?.login || null, enabled: Boolean(user?.githubAutomation?.enabled) } });
});
router.put('/github/automation', authenticate, async (req, res) => {
  const enabled = req.body?.enabled === true;
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });
  if (enabled && !user.github?.login) return res.status(409).json({ success: false, message: 'Collega e verifica GitHub prima di attivare l’automazione' });
  user.githubAutomation.enabled = enabled;
  user.githubAutomation.updatedAt = new Date();
  if (enabled && !user.githubAutomation.consentedAt) user.githubAutomation.consentedAt = new Date();
  await user.save();
  return res.json({ success: true, data: { linked: Boolean(user.github?.login), login: user.github?.login || null, enabled } });
});
router.put('/profile/bio', authenticate, async (req,res)=>{ try { const bio=typeof req.body?.bio==='string'?req.body.bio.trim():''; if(!bio)return res.status(400).json({success:false,message:'Inserisci una bio'}); if(bio.length>1000)return res.status(400).json({success:false,message:'Bio troppo lunga'}); const user=await User.findById(req.userId); if(!user)return res.status(404).json({success:false,message:'Utente non trovato'}); user.communityProfile=user.communityProfile||{}; user.communityProfile.bio=bio; user.communityProfile.updatedAt=new Date(); await user.save(); return res.json({success:true,data:{bio}}); } catch(error){ return res.status(500).json({success:false,message:'Impossibile salvare la bio MyZubster'}); }});

router.get('/profile/professional', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('professionalProfile');
    if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });
    return res.json({ success: true, data: { profile: user.professionalProfile || null } });
  } catch (error) {
    console.error('Professional profile read error:', error);
    return res.status(500).json({ success: false, message: 'Impossibile leggere il profilo professionale' });
  }
});

router.put('/profile/professional', authenticate, async (req, res) => {
  try {
    if (req.body?.approved !== true) {
      return res.status(400).json({
        success: false,
        message: 'Serve approvazione esplicita prima di registrare il profilo professionale'
      });
    }

    const visibility = req.body?.visibility;
    if (!['private', 'public'].includes(visibility)) {
      return res.status(400).json({ success: false, message: 'Visibilità profilo non valida' });
    }

    const profile = normalizeProfessionalProfile(req.body?.profile);
    const validationErrors = validateProfessionalProfile(profile);
    if (validationErrors.length) {
      return res.status(400).json({ success: false, message: validationErrors[0], errors: validationErrors });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });

    const now = new Date();
    const version = Number(user.professionalProfile?.version || 0) + 1;
    user.professionalProfile = {
      ...profile,
      approvalStatus: 'approved',
      visibility,
      approvedAt: now,
      publishedAt: visibility === 'public' ? now : null,
      updatedAt: now,
      version
    };
    await user.save();

    return res.json({
      success: true,
      data: {
        profile: user.professionalProfile,
        published: visibility === 'public'
      }
    });
  } catch (error) {
    console.error('Professional profile save error:', error);
    return res.status(500).json({ success: false, message: 'Impossibile salvare il profilo professionale' });
  }
});
router.post('/github/automation/apply', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('github +githubAutomation.accessTokenEncrypted githubAutomation.enabled githubAutomation.consentedAt githubAutomation.updatedAt githubAutomation.writeAuthorizedAt githubAutomation.previousName githubAutomation.previousBio githubAutomation.previousReadme githubAutomation.previousReadmeExisted githubAutomation.lastPublishedName githubAutomation.lastPublishedBio githubAutomation.lastPublishedReadme');
    if (!user?.github?.login) return res.status(409).json({ success:false, message:'Collega GitHub prima di applicare modifiche' });
    if (!user.githubAutomation?.enabled) return res.status(409).json({ success:false, message:'Attiva prima l’automazione GitHub' });
    if (!user.githubAutomation?.accessTokenEncrypted) return res.status(403).json({ success:false, message:'Autorizza prima le modifiche GitHub' });
    if (req.body?.approved !== true) return res.status(400).json({ success:false, message:'Serve una conferma esplicita dell’anteprima prima della pubblicazione' });
    const name = typeof req.body?.name === 'string' ? req.body.name.trim().slice(0,180) : '';
    const bio = typeof req.body?.bio === 'string' ? req.body.bio.trim().slice(0,160) : '';
    const readme = typeof req.body?.readme === 'string' ? req.body.readme.trim().slice(0,50000) : '';
    if (!name && !bio && !readme) return res.status(400).json({ success:false, message:'Nessuna modifica approvata da applicare' });

    const token = decryptToken(user.githubAutomation.accessTokenEncrypted);
    const applied=[];
    const snapshot=user.github?.publicSnapshot||{};
    const previousReadme=readme ? await getProfileReadme(token,user.github.login) : null;

    if (name || bio) {
      await updateProfile(token,{...(name?{name}:{}),...(bio?{bio}:{})});
      if(name){
        user.githubAutomation.previousName=String(snapshot.name||'').slice(0,180);
        user.githubAutomation.lastPublishedName=name;
        if(user.github?.publicSnapshot)user.github.publicSnapshot.name=name;
        applied.push('name');
      }
      if(bio){
        user.githubAutomation.previousBio=String(snapshot.bio||'').slice(0,160);
        user.githubAutomation.lastPublishedBio=bio;
        if(user.github?.publicSnapshot)user.github.publicSnapshot.bio=bio;
        applied.push('bio');
      }
    }
    if (readme) {
      user.githubAutomation.previousReadme=String(previousReadme?.content||'').slice(0,50000);
      user.githubAutomation.previousReadmeExisted=Boolean(previousReadme?.exists);
      await updateProfileReadme(token,user.github.login,readme);
      user.githubAutomation.lastPublishedReadme=readme;
      if(user.github?.publicSnapshot)user.github.publicSnapshot.profileReadme=readme.slice(0,12000);
      applied.push('readme');
    }
    user.githubAutomation.updatedAt=new Date(); await user.save();
    return res.json({ success:true, data:{ applied, profileUrl:user.github.profileUrl||('https://github.com/'+user.github.login) } });
  } catch(error) { console.error('GitHub profile automation apply error:',error.message); return res.status(502).json({ success:false, message:'GitHub non ha applicato le modifiche autorizzate' }); }
});
router.post('/github/automation/rollback-profile', authenticate, async (req,res)=>{
  try{
    const user=await User.findById(req.userId).select('github +githubAutomation.accessTokenEncrypted githubAutomation.enabled githubAutomation.consentedAt githubAutomation.updatedAt githubAutomation.writeAuthorizedAt githubAutomation.previousName githubAutomation.previousBio githubAutomation.previousReadme githubAutomation.previousReadmeExisted githubAutomation.lastPublishedName githubAutomation.lastPublishedBio githubAutomation.lastPublishedReadme');
    if(!user?.githubAutomation?.accessTokenEncrypted)return res.status(403).json({success:false,message:'Autorizzazione GitHub non disponibile'});
    const token=decryptToken(user.githubAutomation.accessTokenEncrypted);const restored=[];
    const profilePatch={};
    if(typeof user.githubAutomation.previousName==='string'){profilePatch.name=user.githubAutomation.previousName;restored.push('name');}
    if(typeof user.githubAutomation.previousBio==='string'){profilePatch.bio=user.githubAutomation.previousBio;restored.push('bio');}
    if(Object.keys(profilePatch).length)await updateProfile(token,profilePatch);
    if(typeof user.githubAutomation.previousReadmeExisted==='boolean'){
      if(user.githubAutomation.previousReadmeExisted)await updateProfileReadme(token,user.github.login,user.githubAutomation.previousReadme||'');
      else await deleteProfileReadme(token,user.github.login);
      restored.push('readme');
    }
    if(!restored.length)return res.status(409).json({success:false,message:'Nessuna versione precedente da ripristinare'});
    if(user.github?.publicSnapshot){
      if(typeof profilePatch.name==='string')user.github.publicSnapshot.name=profilePatch.name;
      if(typeof profilePatch.bio==='string')user.github.publicSnapshot.bio=profilePatch.bio;
      if(typeof user.githubAutomation.previousReadmeExisted==='boolean')user.github.publicSnapshot.profileReadme=user.githubAutomation.previousReadmeExisted?String(user.githubAutomation.previousReadme||'').slice(0,12000):'';
    }
    user.githubAutomation.updatedAt=new Date();await user.save();
    return res.json({success:true,data:{restored}});
  }catch(error){console.error('GitHub profile rollback error:',error.message);return res.status(502).json({success:false,message:'GitHub non ha ripristinato il profilo'});}
});
router.post('/github/automation/rollback-bio', authenticate, async (req,res)=>{ try { const user=await User.findById(req.userId).select('github +githubAutomation.accessTokenEncrypted githubAutomation.enabled githubAutomation.consentedAt githubAutomation.updatedAt githubAutomation.writeAuthorizedAt githubAutomation.previousName githubAutomation.previousBio githubAutomation.previousReadme githubAutomation.previousReadmeExisted githubAutomation.lastPublishedName githubAutomation.lastPublishedBio githubAutomation.lastPublishedReadme'); if(!user?.githubAutomation?.accessTokenEncrypted)return res.status(403).json({success:false,message:'Autorizzazione GitHub non disponibile'}); if(typeof user.githubAutomation.previousBio!=='string')return res.status(409).json({success:false,message:'Nessuna bio precedente da ripristinare'}); const token=decryptToken(user.githubAutomation.accessTokenEncrypted); const restore=user.githubAutomation.previousBio; await updateBio(token,restore); const current=user.githubAutomation.lastPublishedBio||''; user.githubAutomation.lastPublishedBio=restore; user.githubAutomation.previousBio=current; if(user.github?.publicSnapshot)user.github.publicSnapshot.bio=restore; user.githubAutomation.updatedAt=new Date(); await user.save(); return res.json({success:true,data:{bio:restore}}); } catch(error){ console.error('GitHub bio rollback error:',error.message); return res.status(502).json({success:false,message:'GitHub non ha ripristinato la bio'}); }});
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

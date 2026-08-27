const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const {
  encryptSecret,
  deriveProfile,
  sampleGmail,
  syncUser
} = require('../services/gmailProfileSync');

function jwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET non configurato');
  return process.env.JWT_SECRET;
}

function gmailConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_OAUTH_CALLBACK_URL || `${process.env.GATEWAY_PUBLIC_URL || ''}/api/auth/gmail/callback`;
  const frontendUrl = (process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  if (!clientId || !clientSecret || !callbackUrl.startsWith('http')) {
    throw new Error('Google OAuth non configurato: servono GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET e GOOGLE_OAUTH_CALLBACK_URL (o GATEWAY_PUBLIC_URL)');
  }
  return { clientId, clientSecret, callbackUrl, frontendUrl };
}

function signProfileDraft(profile) {
  return jwt.sign({ purpose: 'zorgax-email-profile', profile }, jwtSecret(), { expiresIn: '15m' });
}

function verifyProfileDraft(ticket) {
  const payload = jwt.verify(ticket, jwtSecret());
  if (payload.purpose !== 'zorgax-email-profile' || !payload.profile?.archetype || !Array.isArray(payload.profile?.traits)) {
    throw new Error('Bozza email non valida');
  }
  return payload.profile;
}

function signOAuthState(payload) {
  return jwt.sign(
    { purpose: 'gmail-oauth-state', nonce: crypto.randomBytes(16).toString('hex'), ...payload },
    process.env.GOOGLE_OAUTH_STATE_SECRET || jwtSecret(),
    { expiresIn: '10m' }
  );
}

function verifyOAuthState(state) {
  const payload = jwt.verify(state, process.env.GOOGLE_OAUTH_STATE_SECRET || jwtSecret());
  if (payload.purpose !== 'gmail-oauth-state') throw new Error('OAuth state non valido');
  return payload;
}

function buildGoogleAuthUrl(config, state, offline = false) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.callbackUrl,
    response_type: 'code',
    access_type: offline ? 'offline' : 'online',
    include_granted_scopes: 'true',
    scope: 'https://www.googleapis.com/auth/gmail.readonly',
    state,
    prompt: offline ? 'consent' : 'select_account'
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeCode(config, code) {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.callbackUrl,
      grant_type: 'authorization_code'
    })
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Scambio token Google non riuscito');
  }
  return tokenData;
}

exports.gmailStart = async (_req, res) => {
  try {
    const config = gmailConfig();
    const state = signOAuthState({ mode: 'one-time' });
    res.redirect(buildGoogleAuthUrl(config, state, false));
  } catch (error) {
    res.status(503).json({ success: false, message: error.message });
  }
};

exports.autoSyncStartUrl = async (req, res) => {
  try {
    const config = gmailConfig();
    if (!process.env.GMAIL_TOKEN_ENCRYPTION_KEY) {
      return res.status(503).json({ success: false, message: 'Auto-sync Gmail non configurato sul server' });
    }
    const state = signOAuthState({ mode: 'auto-sync', userId: String(req.userId) });
    res.json({
      success: true,
      data: {
        authorizationUrl: buildGoogleAuthUrl(config, state, true),
        notice: 'L’aggiornamento automatico richiede accesso Gmail in sola lettura e può essere disattivato in qualsiasi momento.'
      }
    });
  } catch (error) {
    res.status(503).json({ success: false, message: error.message });
  }
};

exports.gmailCallback = async (req, res) => {
  let frontendUrl = (process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  try {
    const config = gmailConfig();
    frontendUrl = config.frontendUrl;
    const { code, state, error: oauthError } = req.query;
    if (oauthError) throw new Error(`Google OAuth: ${oauthError}`);
    if (!code || !state) throw new Error('Callback Gmail incompleto');
    const statePayload = verifyOAuthState(state);
    const tokenData = await exchangeCode(config, code);

    if (statePayload.mode === 'auto-sync') {
      if (!statePayload.userId) throw new Error('Utente auto-sync mancante');
      if (!tokenData.refresh_token) {
        throw new Error('Google non ha restituito un refresh token. Revoca l’accesso MyZubster da Google e riprova.');
      }
      const user = await User.findById(statePayload.userId).select('+gmailProfileSync.refreshTokenEncrypted');
      if (!user) throw new Error('Utente non trovato');

      const messages = await sampleGmail(tokenData.access_token, 180, 30);
      const profile = deriveProfile(messages);
      const now = new Date();
      user.gmailProfileSync = {
        enabled: true,
        refreshTokenEncrypted: encryptSecret(tokenData.refresh_token),
        consentedAt: now,
        lastSyncedAt: now,
        revokedAt: undefined,
        historyWindowDays: 180,
        sampleSize: 30,
        lastStatus: 'success',
        lastError: undefined
      };
      user.zorgaxProfile = {
        archetype: profile.archetype,
        traits: profile.traits.slice(0, 4),
        summary: profile.summary,
        source: 'gmail-auto-sync',
        approvedAt: now,
        updatedAt: now
      };
      await user.save();

      const redirect = new URL('/zorgax-email-profile.html', `${frontendUrl}/`);
      redirect.searchParams.set('email_auto_sync', 'enabled');
      return res.redirect(redirect.toString());
    }

    const messages = await sampleGmail(tokenData.access_token, 180, 12);
    const profile = deriveProfile(messages);
    const ticket = signProfileDraft(profile);
    const redirect = new URL('/zorgax-email-profile.html', `${frontendUrl}/`);
    redirect.searchParams.set('email_profile_ticket', ticket);
    redirect.searchParams.set('email_profile', 'ready');
    return res.redirect(redirect.toString());
  } catch (error) {
    const redirect = new URL('/zorgax-email-profile.html', `${frontendUrl}/`);
    redirect.searchParams.set('email_profile', 'error');
    redirect.searchParams.set('email_profile_message', String(error.message || 'Errore Gmail').slice(0, 180));
    return res.redirect(redirect.toString());
  }
};

exports.verifyDraft = async (req, res) => {
  try {
    const profile = verifyProfileDraft(req.body?.ticket);
    res.json({ success: true, data: { profile } });
  } catch (_error) {
    res.status(400).json({ success: false, message: 'Bozza Gmail scaduta o non valida' });
  }
};

exports.applyDraft = async (req, res) => {
  try {
    const profile = verifyProfileDraft(req.body?.ticket);
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });
    user.zorgaxProfile = {
      archetype: profile.archetype,
      traits: profile.traits.slice(0, 4),
      summary: profile.summary,
      source: 'gmail-derived',
      approvedAt: new Date(),
      updatedAt: new Date()
    };
    await user.save();
    res.json({ success: true, data: { profile: user.zorgaxProfile } });
  } catch (_error) {
    res.status(400).json({ success: false, message: 'Impossibile applicare la bozza Gmail' });
  }
};

exports.autoSyncStatus = async (req, res) => {
  const user = await User.findById(req.userId).select('zorgaxProfile gmailProfileSync.enabled gmailProfileSync.consentedAt gmailProfileSync.lastSyncedAt gmailProfileSync.lastStatus gmailProfileSync.lastError gmailProfileSync.historyWindowDays gmailProfileSync.sampleSize');
  if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });
  res.json({ success: true, data: { sync: user.gmailProfileSync || { enabled: false }, profile: user.zorgaxProfile || null } });
};

exports.disableAutoSync = async (req, res) => {
  const user = await User.findById(req.userId).select('+gmailProfileSync.refreshTokenEncrypted');
  if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });
  user.gmailProfileSync.enabled = false;
  user.gmailProfileSync.refreshTokenEncrypted = undefined;
  user.gmailProfileSync.revokedAt = new Date();
  user.gmailProfileSync.lastStatus = 'revoked';
  user.gmailProfileSync.lastError = undefined;
  await user.save();
  res.json({ success: true, message: 'Aggiornamento automatico Gmail disattivato e token locale eliminato' });
};

exports.runAutoSync = async (req, res) => {
  const expected = Buffer.from(String(process.env.CRON_SECRET || ''));
  const supplied = Buffer.from(String(req.headers.authorization || '').replace(/^Bearer\s+/i, ''));
  const authorized = expected.length > 0 && expected.length === supplied.length && crypto.timingSafeEqual(supplied, expected);
  if (!authorized) {
    return res.status(401).json({ success: false, message: 'Cron non autorizzato' });
  }

  const users = await User.find({ 'gmailProfileSync.enabled': true })
    .select('+gmailProfileSync.refreshTokenEncrypted')
    .limit(100);
  let synced = 0;
  let failed = 0;
  for (const user of users) {
    try {
      await syncUser(user);
      synced += 1;
    } catch (_error) {
      failed += 1;
    }
  }
  res.json({ success: true, data: { attempted: users.length, synced, failed } });
};

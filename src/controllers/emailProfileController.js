const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

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

function deriveProfile(messages) {
  const text = messages.map(item => `${item.subject || ''} ${item.snippet || ''}`).join(' ').toLowerCase();
  const groups = {
    guardian: ['security', 'privacy', 'auth', 'cyber', 'risk', 'sicurezza', 'protezione'],
    builder: ['code', 'github', 'project', 'build', 'deploy', 'api', 'software', 'sviluppo', 'progetto', 'lavoro'],
    explorer: ['research', 'learn', 'travel', 'science', 'ai', 'future', 'ricerca', 'studio', 'viaggio', 'scienza'],
    caretaker: ['community', 'family', 'health', 'environment', 'garden', 'comunità', 'famiglia', 'salute', 'ambiente']
  };
  const ranked = Object.entries(groups).map(([name, words]) => [name, words.reduce((n, word) => n + (text.split(word).length - 1), 0)]).sort((a, b) => b[1] - a[1]);
  const archetype = ranked[0]?.[1] > 0 ? ranked[0][0] : 'explorer';

  const traitMap = [
    ['technology', ['github', 'software', 'code', 'api', 'ai', 'tech']],
    ['learning', ['learn', 'study', 'course', 'research', 'studio', 'ricerca']],
    ['community', ['community', 'team', 'family', 'comunità', 'famiglia']],
    ['travel', ['travel', 'flight', 'hotel', 'trip', 'viaggio']],
    ['projects', ['project', 'build', 'deploy', 'progetto']],
    ['privacy', ['privacy', 'security', 'sicurezza']],
    ['creativity', ['design', 'art', 'comic', 'music', 'creative', 'disegno', 'musica']]
  ];
  const traits = traitMap
    .map(([trait, words]) => [trait, words.reduce((n, word) => n + (text.split(word).length - 1), 0)])
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([trait]) => trait);
  if (!traits.length) traits.push('curiosity', 'communication');

  return {
    archetype,
    traits,
    summary: `Bozza privata derivata da ${messages.length} email recenti. Evidenzia soprattutto: ${traits.join(', ')}. Nessun contenuto email originale viene conservato nel profilo.`
  };
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

exports.gmailStart = async (_req, res) => {
  try {
    const config = gmailConfig();
    const state = jwt.sign({ purpose: 'gmail-oauth-state', nonce: crypto.randomBytes(16).toString('hex') }, process.env.GOOGLE_OAUTH_STATE_SECRET || jwtSecret(), { expiresIn: '10m' });
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackUrl,
      response_type: 'code',
      access_type: 'online',
      include_granted_scopes: 'true',
      scope: 'https://www.googleapis.com/auth/gmail.readonly',
      state,
      prompt: 'consent'
    });
    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
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
    const statePayload = jwt.verify(state, process.env.GOOGLE_OAUTH_STATE_SECRET || jwtSecret());
    if (statePayload.purpose !== 'gmail-oauth-state') throw new Error('OAuth state non valido');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: config.callbackUrl, grant_type: 'authorization_code' })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error_description || tokenData.error || 'Scambio token Google non riuscito');

    const headers = { Authorization: `Bearer ${tokenData.access_token}` };
    const listResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=12&q=newer_than:180d', { headers });
    const listData = await listResponse.json();
    if (!listResponse.ok) throw new Error(listData.error?.message || 'Impossibile leggere Gmail');
    const ids = Array.isArray(listData.messages) ? listData.messages.slice(0, 12) : [];

    const messages = (await Promise.all(ids.map(async item => {
      const messageResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=Subject`, { headers });
      if (!messageResponse.ok) return null;
      const message = await messageResponse.json();
      const subjectHeader = (message.payload?.headers || []).find(header => String(header.name).toLowerCase() === 'subject');
      return { subject: subjectHeader?.value || '', snippet: String(message.snippet || '').slice(0, 180) };
    }))).filter(Boolean);

    const profile = deriveProfile(messages);
    const ticket = signProfileDraft(profile);
    const redirect = new URL('/zorgax-email-profile.html', `${frontendUrl}/`);
    redirect.searchParams.set('email_profile_ticket', ticket);
    redirect.searchParams.set('email_profile', 'ready');
    return res.redirect(redirect.toString());
  } catch (error) {
    const redirect = new URL('/zorgax-email-profile.html', `${frontendUrl}/`);
    redirect.searchParams.set('email_profile', 'error');
    redirect.searchParams.set('email_profile_message', error.message.slice(0, 180));
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

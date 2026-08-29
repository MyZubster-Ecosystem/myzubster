const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { upsertVerifiedAccount } = require('../services/socialIdentityService');

const OAUTH_ENV_KEYS = [
  'GOOGLE_LOGIN_CLIENT_ID',
  'GOOGLE_LOGIN_CLIENT_SECRET',
  'GOOGLE_LOGIN_CALLBACK_URL',
  'GOOGLE_OAUTH_CLIENT_ID',
  'GOOGLE_OAUTH_CLIENT_SECRET',
  'GOOGLE_OAUTH_CALLBACK_URL',
  'GITHUB_OAUTH_CLIENT_ID',
  'GITHUB_OAUTH_CLIENT_SECRET',
  'GITHUB_LOGIN_CALLBACK_URL',
  'GITHUB_OAUTH_CALLBACK_URL',
  'FACEBOOK_LOGIN_APP_ID',
  'FACEBOOK_LOGIN_APP_SECRET',
  'FACEBOOK_LOGIN_CALLBACK_URL'
];

for (const key of OAUTH_ENV_KEYS) {
  if (typeof process.env[key] === 'string') process.env[key] = process.env[key].trim();
}

function secret() { if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET non configurato'); return process.env.JWT_SECRET; }
function frontend() { return (process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || 'https://myzubster.com').replace(/\/$/, ''); }
function callback(provider) {
  if (provider === 'google') return process.env.GOOGLE_LOGIN_CALLBACK_URL || process.env.GOOGLE_OAUTH_CALLBACK_URL || `${process.env.GATEWAY_PUBLIC_URL || 'https://myzubster.com'}/api/auth/social/google/callback`;
  if (provider === 'github') return process.env.GITHUB_LOGIN_CALLBACK_URL || process.env.GITHUB_OAUTH_CALLBACK_URL || `${process.env.GATEWAY_PUBLIC_URL || 'https://myzubster.com'}/api/auth/social/github/callback`;
  return process.env[`${provider.toUpperCase()}_LOGIN_CALLBACK_URL`] || `${process.env.GATEWAY_PUBLIC_URL || 'https://myzubster.com'}/api/auth/social/${provider}/callback`;
}
function state(provider) { return jwt.sign({ purpose: 'social-login', provider, nonce: crypto.randomBytes(16).toString('hex') }, process.env.OAUTH_STATE_SECRET || secret(), { expiresIn: '10m' }); }
function verifyState(value, provider) { const data = jwt.verify(value, process.env.OAUTH_STATE_SECRET || secret()); if (data.purpose !== 'social-login' || data.provider !== provider) throw new Error('OAuth state non valido'); }
function redirectSuccess(res, result, provider) {
  const ticket = jwt.sign({ purpose: 'social-login-result', token: result.token, userId: String(result.user._id), characterId: result.character.characterId, provider }, secret(), { expiresIn: '2m' });
  const url = new URL('/social-login.html', `${frontend()}/`); url.searchParams.set('social_login', 'verified'); url.searchParams.set('provider', provider); url.searchParams.set('social_login_ticket', ticket); res.redirect(url.toString());
}
function redirectError(res, message, provider = '') { const url = new URL('/social-login.html', `${frontend()}/`); url.searchParams.set('social_login', 'error'); if (provider) url.searchParams.set('provider', provider); url.searchParams.set('social_login_message', String(message).slice(0, 180)); res.redirect(url.toString()); }

function providerAvailability() {
  return {
    google: Boolean(
      (process.env.GOOGLE_LOGIN_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID) &&
      (process.env.GOOGLE_LOGIN_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET) &&
      callback('google').startsWith('http')
    ),
    github: Boolean(
      process.env.GITHUB_OAUTH_CLIENT_ID &&
      process.env.GITHUB_OAUTH_CLIENT_SECRET &&
      callback('github').startsWith('http')
    ),
    facebook: Boolean(
      process.env.FACEBOOK_LOGIN_APP_ID &&
      process.env.FACEBOOK_LOGIN_APP_SECRET &&
      callback('facebook').startsWith('http')
    )
  };
}

exports.providers = (_req, res) => {
  res.json({ success: true, data: { providers: providerAvailability() } });
};

exports.start = (req, res) => {
  try {
    const provider = String(req.params.provider || '').toLowerCase();
    if (provider === 'google') {
      const clientId = process.env.GOOGLE_LOGIN_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_LOGIN_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      if (!clientId || !clientSecret || !callback('google').startsWith('http')) throw new Error('Google Login non configurato');
      const params = new URLSearchParams({ client_id: clientId, redirect_uri: callback('google'), response_type: 'code', scope: 'openid email profile', state: state('google'), prompt: 'select_account' });
      return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
    }
    if (provider === 'github') {
      if (!process.env.GITHUB_OAUTH_CLIENT_ID || !process.env.GITHUB_OAUTH_CLIENT_SECRET || !callback('github').startsWith('http')) throw new Error('GitHub Login non configurato');
      const params = new URLSearchParams({ client_id: process.env.GITHUB_OAUTH_CLIENT_ID, redirect_uri: callback('github'), scope: 'read:user user:email', state: state('github') });
      return res.redirect(`https://github.com/login/oauth/authorize?${params}`);
    }
    if (provider === 'facebook') {
      if (!process.env.FACEBOOK_LOGIN_APP_ID || !process.env.FACEBOOK_LOGIN_APP_SECRET || !callback('facebook').startsWith('http')) throw new Error('Facebook Login non configurato');
      const params = new URLSearchParams({ client_id: process.env.FACEBOOK_LOGIN_APP_ID, redirect_uri: callback('facebook'), response_type: 'code', scope: 'public_profile,email', state: state('facebook') });
      return res.redirect(`https://www.facebook.com/dialog/oauth?${params}`);
    }
    res.status(404).json({ success: false, message: 'Provider non supportato' });
  } catch (error) { res.status(503).json({ success: false, message: error.message }); }
};

exports.callback = async (req, res) => {
  const provider = String(req.params.provider || '').toLowerCase();
  try {
    verifyState(req.query.state, provider); if (!req.query.code) throw new Error('OAuth callback incompleto');
    let profile;
    if (provider === 'google') {
      const clientId = process.env.GOOGLE_LOGIN_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_LOGIN_CLIENT_SECRET || process.env.GOOGLE_OAUTH_CLIENT_SECRET;
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code: req.query.code, client_id: clientId, client_secret: clientSecret, redirect_uri: callback('google'), grant_type: 'authorization_code' }) });
      const tokens = await tokenRes.json(); if (!tokenRes.ok || !tokens.access_token) throw new Error('Login Google non riuscito');
      const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${tokens.access_token}` } }); const user = await userRes.json();
      if (!userRes.ok || !user.sub || !user.email || user.email_verified !== true) throw new Error('Google non ha restituito una email verificata');
      profile = { id: user.sub, email: user.email, name: user.name, avatarUrl: user.picture };
    } else if (provider === 'github') {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: process.env.GITHUB_OAUTH_CLIENT_ID, client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET, code: req.query.code, redirect_uri: callback('github') }) });
      const tokens = await tokenRes.json(); if (!tokenRes.ok || !tokens.access_token) throw new Error('Login GitHub non riuscito');
      const headers = { Accept: 'application/vnd.github+json', Authorization: `Bearer ${tokens.access_token}`, 'User-Agent': 'MyZubster-Gateway' };
      const userRes = await fetch('https://api.github.com/user', { headers }); const user = await userRes.json(); if (!userRes.ok || !user.id) throw new Error('Profilo GitHub non disponibile');
      let email = user.email; if (!email) { const e = await fetch('https://api.github.com/user/emails', { headers }); if (e.ok) { const list = await e.json(); email = list.find(x => x.primary && x.verified)?.email || list.find(x => x.verified)?.email; } }
      if (!email) throw new Error('Serve una email GitHub verificata per creare un nuovo account');
      profile = { id: String(user.id), email, name: user.name, login: user.login, avatarUrl: user.avatar_url, profileUrl: user.html_url };
    } else if (provider === 'facebook') {
      const tokenUrl = new URL('https://graph.facebook.com/oauth/access_token');
      tokenUrl.searchParams.set('client_id', process.env.FACEBOOK_LOGIN_APP_ID);
      tokenUrl.searchParams.set('client_secret', process.env.FACEBOOK_LOGIN_APP_SECRET);
      tokenUrl.searchParams.set('redirect_uri', callback('facebook'));
      tokenUrl.searchParams.set('code', req.query.code);
      const tokenRes = await fetch(tokenUrl); const tokens = await tokenRes.json();
      if (!tokenRes.ok || !tokens.access_token) throw new Error('Login Facebook non riuscito');
      const meUrl = new URL('https://graph.facebook.com/me'); meUrl.searchParams.set('fields', 'id,name,email,picture'); meUrl.searchParams.set('access_token', tokens.access_token);
      const userRes = await fetch(meUrl); const user = await userRes.json();
      if (!userRes.ok || !user.id) throw new Error('Profilo Facebook non disponibile');
      if (!user.email) throw new Error('Facebook non ha condiviso una email: autorizza il permesso email per creare o collegare l account');
      profile = { id: String(user.id), email: user.email, name: user.name, avatarUrl: user.picture?.data?.url || null };
    } else throw new Error('Provider non supportato');
    redirectSuccess(res, await upsertVerifiedAccount(provider, profile), provider);
  } catch (error) { redirectError(res, error.message, provider); }
};

exports.exchangeTicket = async (req, res) => {
  try { const data = jwt.verify(req.body?.ticket, secret()); if (data.purpose !== 'social-login-result') throw new Error(); res.json({ success: true, data: { token: data.token, userId: data.userId, characterId: data.characterId, provider: data.provider, metaverseVerified: true } }); }
  catch (_) { res.status(400).json({ success: false, message: 'Ticket login scaduto o non valido' }); }
};

const crypto = require('crypto');
const User = require('../models/User');

function encryptionKey() {
  const raw = process.env.GMAIL_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error('GMAIL_TOKEN_ENCRYPTION_KEY non configurata');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('GMAIL_TOKEN_ENCRYPTION_KEY deve essere una chiave base64 da 32 byte');
  return key;
}

function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(part => part.toString('base64url')).join('.');
}

function decryptSecret(value) {
  const [ivEncoded, tagEncoded, encryptedEncoded] = String(value || '').split('.');
  if (!ivEncoded || !tagEncoded || !encryptedEncoded) throw new Error('Token Gmail cifrato non valido');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivEncoded, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagEncoded, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedEncoded, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}

function googleConfig() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Google OAuth non configurato');
  return { clientId, clientSecret };
}

function deriveProfile(messages) {
  const text = messages.map(item => `${item.subject || ''} ${item.snippet || ''}`).join(' ').toLowerCase();
  const groups = {
    guardian: ['security', 'privacy', 'auth', 'cyber', 'risk', 'sicurezza', 'protezione'],
    builder: ['code', 'github', 'project', 'build', 'deploy', 'api', 'software', 'sviluppo', 'progetto', 'lavoro'],
    explorer: ['research', 'learn', 'travel', 'science', 'ai', 'future', 'ricerca', 'studio', 'viaggio', 'scienza'],
    caretaker: ['community', 'family', 'health', 'environment', 'garden', 'comunità', 'famiglia', 'salute', 'ambiente']
  };
  const ranked = Object.entries(groups)
    .map(([name, words]) => [name, words.reduce((n, word) => n + (text.split(word).length - 1), 0)])
    .sort((a, b) => b[1] - a[1]);
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
    summary: `Profilo privato aggiornato automaticamente da un campione di ${messages.length} email nello storico autorizzato. Interessi prevalenti: ${traits.join(', ')}. I contenuti originali delle email non vengono conservati.`
  };
}

async function refreshAccessToken(refreshToken) {
  const config = googleConfig();
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    })
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    const error = new Error(data.error_description || data.error || 'Refresh token Google non valido');
    error.code = data.error || 'google_refresh_failed';
    throw error;
  }
  return data.access_token;
}

async function sampleGmail(accessToken, historyWindowDays = 180, sampleSize = 30) {
  const safeDays = Math.max(30, Math.min(365, Number(historyWindowDays) || 180));
  const safeSize = Math.max(5, Math.min(50, Number(sampleSize) || 30));
  const headers = { Authorization: `Bearer ${accessToken}` };
  const listUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages');
  listUrl.searchParams.set('maxResults', String(safeSize));
  listUrl.searchParams.set('q', `newer_than:${safeDays}d`);
  const listResponse = await fetch(listUrl, { headers });
  const listData = await listResponse.json();
  if (!listResponse.ok) throw new Error(listData.error?.message || 'Impossibile leggere Gmail');
  const ids = Array.isArray(listData.messages) ? listData.messages.slice(0, safeSize) : [];

  return (await Promise.all(ids.map(async item => {
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=Subject`;
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    const message = await response.json();
    const subjectHeader = (message.payload?.headers || []).find(header => String(header.name).toLowerCase() === 'subject');
    return {
      subject: subjectHeader?.value || '',
      snippet: String(message.snippet || '').slice(0, 180)
    };
  }))).filter(Boolean);
}

async function syncUser(user) {
  const fullUser = user.gmailProfileSync?.refreshTokenEncrypted
    ? user
    : await User.findById(user._id).select('+gmailProfileSync.refreshTokenEncrypted');
  if (!fullUser?.gmailProfileSync?.enabled || !fullUser.gmailProfileSync.refreshTokenEncrypted) return null;

  try {
    const refreshToken = decryptSecret(fullUser.gmailProfileSync.refreshTokenEncrypted);
    const accessToken = await refreshAccessToken(refreshToken);
    const messages = await sampleGmail(
      accessToken,
      fullUser.gmailProfileSync.historyWindowDays,
      fullUser.gmailProfileSync.sampleSize
    );
    const profile = deriveProfile(messages);
    const now = new Date();
    fullUser.zorgaxProfile = {
      archetype: profile.archetype,
      traits: profile.traits,
      summary: profile.summary,
      source: 'gmail-auto-sync',
      approvedAt: fullUser.zorgaxProfile?.approvedAt || fullUser.gmailProfileSync.consentedAt || now,
      updatedAt: now
    };
    fullUser.gmailProfileSync.lastSyncedAt = now;
    fullUser.gmailProfileSync.lastStatus = 'success';
    fullUser.gmailProfileSync.lastError = undefined;
    await fullUser.save();
    return profile;
  } catch (error) {
    fullUser.gmailProfileSync.lastStatus = 'error';
    fullUser.gmailProfileSync.lastError = String(error.message || 'Errore sync Gmail').slice(0, 300);
    if (error.code === 'invalid_grant') {
      fullUser.gmailProfileSync.enabled = false;
      fullUser.gmailProfileSync.refreshTokenEncrypted = undefined;
      fullUser.gmailProfileSync.revokedAt = new Date();
      fullUser.gmailProfileSync.lastStatus = 'revoked';
    }
    await fullUser.save();
    throw error;
  }
}

module.exports = {
  encryptSecret,
  deriveProfile,
  sampleGmail,
  syncUser
};

const User = require('../models/User');
const jwt = require('jsonwebtoken');

function isValidMoneroAddress(value) {
  if (!value) return true;
  const address = String(value).trim();
  const alphabet = '[1-9A-HJ-NP-Za-km-z]';
  return new RegExp(`^[48]${alphabet}{94}$`).test(address) || new RegExp(`^4${alphabet}{105}$`).test(address);
}

function jwtSecret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET non configurato');
  return process.env.JWT_SECRET;
}

function githubConfig() {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_OAUTH_CALLBACK_URL || `${process.env.GATEWAY_PUBLIC_URL || ''}/api/auth/github/callback`;
  const frontendUrl = (process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  if (!clientId || !clientSecret || !callbackUrl.startsWith('http')) {
    throw new Error('GitHub OAuth non configurato: servono GITHUB_OAUTH_CLIENT_ID, GITHUB_OAUTH_CLIENT_SECRET e GITHUB_OAUTH_CALLBACK_URL (o GATEWAY_PUBLIC_URL)');
  }
  return { clientId, clientSecret, callbackUrl, frontendUrl };
}

function signGithubVerification(profile) {
  return jwt.sign(
    {
      purpose: 'github-verification',
      github: {
        id: String(profile.id),
        login: profile.login,
        name: profile.name || null,
        email: profile.email || null,
        avatarUrl: profile.avatar_url || null,
        profileUrl: profile.html_url || null
      }
    },
    jwtSecret(),
    { expiresIn: '10m' }
  );
}

function verifyGithubTicket(ticket) {
  if (!ticket) return null;
  const payload = jwt.verify(ticket, jwtSecret());
  if (payload.purpose !== 'github-verification' || !payload.github?.id || !payload.github?.login) {
    throw new Error('Ticket GitHub non valido');
  }
  return payload.github;
}

exports.githubStart = async (req, res) => {
  try {
    const { clientId, callbackUrl } = githubConfig();
    const state = jwt.sign(
      { purpose: 'github-oauth-state', nonce: require('crypto').randomBytes(16).toString('hex') },
      process.env.GITHUB_OAUTH_STATE_SECRET || jwtSecret(),
      { expiresIn: '10m' }
    );
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: 'read:user user:email',
      state
    });
    res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
  } catch (error) {
    console.error('GitHub OAuth start error:', error);
    res.status(503).json({ success: false, message: error.message });
  }
};

exports.githubCallback = async (req, res) => {
  let frontendUrl = (process.env.FRONTEND_URL || process.env.PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  try {
    const { code, state, error: oauthError } = req.query;
    const config = githubConfig();
    frontendUrl = config.frontendUrl;
    if (oauthError) throw new Error(`GitHub OAuth: ${oauthError}`);
    if (!code || !state) throw new Error('Callback GitHub incompleto');

    const statePayload = jwt.verify(state, process.env.GITHUB_OAUTH_STATE_SECRET || jwtSecret());
    if (statePayload.purpose !== 'github-oauth-state') throw new Error('OAuth state non valido');

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.callbackUrl
      })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || tokenData.error || 'Scambio token GitHub non riuscito');
    }

    const headers = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${tokenData.access_token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'MyZubster-Gateway'
    };
    const userResponse = await fetch('https://api.github.com/user', { headers });
    if (!userResponse.ok) throw new Error('Impossibile leggere il profilo GitHub autorizzato');
    const profile = await userResponse.json();

    if (!profile.email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', { headers });
      if (emailResponse.ok) {
        const emails = await emailResponse.json();
        const preferred = Array.isArray(emails)
          ? emails.find(item => item.primary && item.verified) || emails.find(item => item.verified)
          : null;
        if (preferred) profile.email = preferred.email;
      }
    }

    const ticket = signGithubVerification(profile);
    const redirect = new URL(frontendUrl);
    redirect.searchParams.set('github_oauth_ticket', ticket);
    redirect.searchParams.set('github_oauth', 'verified');
    res.redirect(redirect.toString());
  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    const redirect = new URL(frontendUrl);
    redirect.searchParams.set('github_oauth', 'error');
    redirect.searchParams.set('github_oauth_message', error.message.slice(0, 180));
    res.redirect(redirect.toString());
  }
};

exports.githubVerifyTicket = async (req, res) => {
  try {
    const github = verifyGithubTicket(req.body?.ticket);
    res.json({ success: true, data: { github } });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Verifica GitHub scaduta o non valida' });
  }
};

exports.register = async (req, res) => {
  try {
    const { username, email, password, moneroWallet, githubVerificationToken } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email e password sono obbligatori' });
    }

    if (moneroWallet && !isValidMoneroAddress(moneroWallet)) {
      return res.status(400).json({
        success: false,
        message: 'Indirizzo XMR non valido. Inserisci solo un indirizzo pubblico Monero; non inserire seed phrase o chiavi private.'
      });
    }

    let github = null;
    if (githubVerificationToken) {
      try {
        github = verifyGithubTicket(githubVerificationToken);
      } catch (error) {
        return res.status(400).json({ success: false, message: 'Verifica GitHub scaduta o non valida. Ricollega GitHub.' });
      }
    }

    const checks = [{ email }, { username }];
    if (github?.id) checks.push({ 'github.id': github.id });
    const existingUser = await User.findOne({ $or: checks });
    if (existingUser) return res.status(400).json({ success: false, message: 'Username, email o account GitHub già in uso' });

    const user = new User({
      username,
      email,
      password,
      moneroWallet: moneroWallet ? String(moneroWallet).trim() : null,
      ...(github ? {
        github: {
          id: github.id,
          login: github.login,
          avatarUrl: github.avatarUrl,
          profileUrl: github.profileUrl,
          verifiedAt: new Date()
        }
      } : {})
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      jwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Utente registrato con successo',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          moneroWallet: user.moneroWallet,
          github: user.github?.id ? user.github : null,
          createdAt: user.createdAt
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Errore durante la registrazione', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email e password sono obbligatori' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Credenziali non valide' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Credenziali non valide' });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      jwtSecret(),
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login effettuato con successo',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          moneroWallet: user.moneroWallet,
          github: user.github?.id ? user.github : null,
          lastLogin: user.lastLogin
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Errore durante il login', error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });
    res.json({ success: true, data: { user } });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ success: false, message: 'Errore durante il recupero del profilo', error: error.message });
  }
};

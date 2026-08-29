const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

app.use(cors());
app.use('/api/github-bounties/webhook', express.json({
  verify: (req, res, buf) => { req.rawBody = Buffer.from(buf); }
}));
app.use(express.json());

const publicRoot = path.resolve(__dirname, 'public');
const htmlAliases = new Map([
  ['/', 'index.html'],
  ['/press', 'press.html'],
  ['/press.html', 'press.html'],
  ['/media', 'press.html'],
  ['/media-kit', 'press.html'],
  ['/fumetto', 'fumetto.html'],
  ['/fumetto.html', 'fumetto.html'],
  ['/comic', 'fumetto.html'],
  ['/comic.html', 'fumetto.html'],
  ['/fumetto/sentinel', 'fumetto-sentinel.html'],
  ['/comic/sentinel', 'fumetto-sentinel.html'],
  ['/come-funziona', 'come-funziona.html'],
  ['/how-it-works', 'come-funziona.html'],
  ['/grok', 'grok.html'],
  ['/zorgax', 'zorgax.html'],
  ['/zorgax-build', 'zorgax-build.html'],
  ['/zorgax-email-profile', 'zorgax-email-profile.html'],
  ['/zorgax-email-profile.html', 'zorgax-email-profile.html'],
  ['/research-search', 'research-search.html'],
]);
const canonicalHtmlRedirects = new Map([
  ['/press.html', '/press'],
  ['/media', '/press'],
  ['/media-kit', '/press'],
  ['/zorgax-email-profile.html', '/zorgax-email-profile'],
]);
const bundledHtmlPaths = new Map([
  ['press.html', require.resolve('./public/press.html')],
  ['zorgax-email-profile.html', require.resolve('./public/zorgax-email-profile.html')],
]);
const vercelAnalyticsSnippet = `
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
</script>
<script defer src="/_vercel/insights/script.js"></script>
`;

app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const destination = canonicalHtmlRedirects.get(req.path);
  if (!destination) return next();
  return res.redirect(308, destination);
});

app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  const alias = htmlAliases.get(req.path);
  const relativePath = alias || (req.path.endsWith('.html') ? req.path.replace(/^\/+/, '') : null);
  if (!relativePath) return next();
  const filePath = bundledHtmlPaths.get(relativePath) || path.resolve(publicRoot, relativePath);
  if (filePath !== publicRoot && !filePath.startsWith(`${publicRoot}${path.sep}`)) return next();
  fs.readFile(filePath, 'utf8', (error, html) => {
    if (error) return next();
    const instrumented = html.includes('/_vercel/insights/script.js')
      ? html
      : html.includes('</head>')
        ? html.replace('</head>', `${vercelAnalyticsSnippet}</head>`)
        : `${vercelAnalyticsSnippet}${html}`;
    res.type('html').status(200).send(instrumented);
  });
});

app.use(express.static('public'));
app.use('/data', express.static('data'));

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
let mongoConnectionPromise = null;

function connectMongo() {
  if (process.env.NODE_ENV === 'test') return Promise.resolve();
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (mongoConnectionPromise) return mongoConnectionPromise;
  if (!mongoUri) {
    const error = new Error('MongoDB non configurato: impostare MONGODB_URI (o MONGO_URI)');
    console.error(`❌ ${error.message}`);
    return Promise.reject(error);
  }
  mongoConnectionPromise = mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
      mongoConnectionPromise = null;
      console.error('❌ MongoDB connection error:', err);
      throw err;
    });
  return mongoConnectionPromise;
}

if (process.env.NODE_ENV !== 'test') connectMongo().catch(() => {});

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const bountyRoutes = require('./src/routes/bountyRoutes');
const rewardRoutes = require('./src/routes/rewardRoutes');
const referralRoutes = require('./src/routes/referralRoutes');
const listingRoutes = require('./src/routes/listingRoutes');
const marketplaceTrustRoutes = require('./src/routes/marketplaceTrustRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const zorgaxMonetizationRoutes = require('./src/routes/zorgaxMonetizationRoutes');
const tripRoutes = require('./src/routes/tripRoutes');
const couponRoutes = require('./src/routes/couponRoutes');
const plantRoutes = require('./src/routes/plantRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const nearbyRoutes = require('./src/routes/nearbyRoutes');
const aiForwardRoutes = require('./src/routes/aiForwardRoutes');
const gardenRoutes = require('./src/routes/urbanGardenRoutes');
const geocodeRoutes = require('./src/routes/mapRoutes');
const healthRoutes = require('./src/api/routes');
const grokRoutes = require('./src/routes/grokRoutes');
const zorgaxRoutes = require('./src/routes/zorgaxRoutes');
const zorgaxBuildRoutes = require('./src/routes/zorgaxBuildRoutes');
const zorgaxAssistantRoutes = require('./src/routes/zorgaxAssistantRoutes');
const zorgaxLifeRoutes = require('./src/routes/zorgaxLifeRoutes');
const zorgaxEmailRoutes = require('./src/routes/zorgaxEmailRoutes');
const githubBountySyncRoutes = require('./src/routes/githubBountySyncRoutes');
const researchRoutes = require('./src/routes/researchRoutes');
const municipalityRoutes = require('./src/routes/municipalityRoutes');
const entityRoutes = require('./src/routes/entityRoutes');
const metaverseRoutes = require('./backend/src/routes/metaverse');

app.post('/api/auth/register', async (_req, res, next) => {
  try { await connectMongo(); next(); }
  catch (_error) { res.status(503).json({ success: false, message: 'Database temporaneamente non disponibile' }); }
});

app.post('/api/metaverse/join', async (_req, res, next) => {
  if (process.env.NODE_ENV === 'test') return next();
  try {
    await connectMongo();
    return next();
  } catch (_error) {
    return res.status(503).json({ success: false, error: 'Character storage is temporarily unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bounties', bountyRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/marketplace', marketplaceTrustRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/zorgax/monetization', zorgaxMonetizationRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/nearby', nearbyRoutes);
app.use('/api/ai-forward', aiForwardRoutes);
app.use('/api/gardens', gardenRoutes);
app.use('/api/municipalities', municipalityRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api', healthRoutes);
app.use('/api/grok', grokRoutes);
app.use('/api/zorgax/assistant', zorgaxAssistantRoutes);
app.use('/api/zorgax/build', zorgaxBuildRoutes);
app.use('/api/zorgax/life', zorgaxLifeRoutes);
app.use('/api/zorgax/email', zorgaxEmailRoutes);
app.use('/api/zorgax', zorgaxRoutes);
app.use('/api/github-bounties', githubBountySyncRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/entities', entityRoutes);
app.use('/api/metaverse', metaverseRoutes);

app.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'MyZubster Gateway',
    status: 'online',
    version: '1.1.0-life',
    port: process.env.PORT || 5003,
    api: '/api',
    life: {
      municipalities: '/api/municipalities',
      gardens: '/api/gardens',
      zorgax: '/api/zorgax',
      zorgax_assistant: '/api/zorgax/assistant',
      zorgax_build: '/api/zorgax/build',
      zorgax_life: '/api/zorgax/life/status',
      zorgax_email: '/api/zorgax/email/preferences'
    }
  });
});

app.get('/grok', (req, res) => res.sendFile(path.join(__dirname, 'public', 'grok.html')));
app.get('/zorgax', (req, res) => res.sendFile(path.join(__dirname, 'public', 'zorgax.html')));
app.get('/zorgax-build', (req, res) => res.sendFile(path.join(__dirname, 'public', 'zorgax-build.html')));
app.get('/research-search', (req, res) => res.sendFile(path.join(__dirname, 'public', 'research-search.html')));
app.get(['/fumetto', '/comic'], (req, res) => res.sendFile(path.join(__dirname, 'public', 'fumetto.html')));

module.exports = app;

const PORT = process.env.PORT || 5003;
if (require.main === module && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
}
/**
 * 🌐 MyZubster Backend - Main Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 5003;

// ---- MIDDLEWARE ----
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ---- MONGODB ----
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster', {
    dbName: process.env.MONGODB_DB_NAME || 'myzubster',
    serverSelectionTimeoutMS: 5000
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB error:', err));

// ============================================
// 📦 ROUTES IMPORT
// ============================================
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const bountyRoutes = require('./src/routes/bountyRoutes');
const rewardRoutes = require('./src/routes/rewardRoutes');
const referralRoutes = require('./src/routes/referralRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');
const adminDashboardRoutes = require('./src/routes/adminDashboardRoutes');
const mapRoutes = require('./src/routes/mapRoutes');
const urbanGardenRoutes = require('./src/routes/urbanGardenRoutes');
const carbonCreditRoutes = require('./src/routes/carbonCreditRoutes');
const listingRoutes = require('./src/routes/listingRoutes');
const bountySystemRoutes = require('./src/routes/bountySystemRoutes');
const plantRoutes = require('./src/routes/plantRoutes');
const searchRoutes = require('./src/routes/searchRoutes');

// ---- Controllers per bounty e conversione ----
const githubWebhookController = require('./src/controllers/githubWebhookController');
const conversionController = require('./src/controllers/conversionController');

// ============================================
// 📍 ROUTES USE
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bounties', bountyRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/garden', urbanGardenRoutes);
app.use('/api/carbon', carbonCreditRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/bounty-system', bountySystemRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/search', searchRoutes);

// ============================================
// 🌿 URBAN LAB ESCROW PROXY
// ============================================
const ESCROW_API = process.env.ESCROW_API_URL || 'http://localhost:5002';

app.get('/api/escrow/status/:id', async (req, res) => {
    try {
        const response = await fetch(`${ESCROW_API}/api/escrow/status/${req.params.id}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Escrow API unreachable' });
    }
});

app.get('/api/escrow/list', async (req, res) => {
    try {
        const response = await fetch(`${ESCROW_API}/api/escrow/list`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Escrow API unreachable' });
    }
});

// ============================================
// 🤖 GITHUB WEBHOOK PER BOUNTY
// ============================================

app.post('/webhook/github', async (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    const secret = process.env.GITHUB_WEBHOOK_SECRET;
    if (secret && !githubWebhookController.verifySignature(JSON.stringify(req.body), signature, secret)) {
        return res.status(401).send('Firma non valida');
    }
    await githubWebhookController.handleIssueClosed(req, res);
});

app.post('/api/register-github', githubWebhookController.registerUser);
app.get('/api/bounty-history', githubWebhookController.getBountyHistory);
app.get('/api/user-balance/:githubUsername', githubWebhookController.getUserBalance);

// ============================================
// 💱 CONVERSIONE MYZ → XMR
// ============================================

app.get('/api/exchange-rate', conversionController.getExchangeRate);
app.post('/api/convert-myz-to-xmr', conversionController.convertMyzToXmr);
app.get('/api/conversion-history', conversionController.getConversionHistory);

// ============================================
// 📧 INVIO PEC
// ============================================
const { sendPEC } = require('./src/utils/email');

app.post('/api/send-pec', async (req, res) => {
    try {
        const { to, subject, text } = req.body;
        if (!to || !subject || !text) {
            return res.status(400).json({ error: 'Mancano campi obbligatori (to, subject, text)' });
        }
        const info = await sendPEC(to, subject, text);
        res.json({ success: true, messageId: info.messageId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// 🏥 HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// ============================================
// 🚀 AVVIO SERVER
// ============================================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`📋 Listings: http://localhost:${PORT}/api/listings`);
    console.log(`💰 Bounties: http://localhost:${PORT}/api/bounties`);
    console.log(`🔐 Escrow proxy: ${ESCROW_API}/api/escrow`);
    console.log(`🌿 Plants: http://localhost:${PORT}/api/plants`);
    console.log(`🔍 Search: http://localhost:${PORT}/api/search`);
    console.log(`✅ Connected to MongoDB`);
});

module.exports = app;

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/data', express.static('data'));

// Connessione a MongoDB (solo se non in test)
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/myzubster')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));
}

// Import routes (modifica i percorsi secondo la tua struttura)
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const bountyRoutes = require('./src/routes/bountyRoutes');
const rewardRoutes = require('./src/routes/rewardRoutes');
const referralRoutes = require('./src/routes/referralRoutes');
const listingRoutes = require('./src/routes/listingRoutes');
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

// Monta le route
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bounties', bountyRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/nearby', nearbyRoutes);
app.use('/api/ai-forward', aiForwardRoutes);
app.use('/api/gardens', gardenRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api', healthRoutes);
app.use('/api/grok', grokRoutes);


// Homepage / health gateway
app.get('/', (req, res) => {
  res.status(200).json({
    ok: true,
    service: 'MyZubster Gateway',
    status: 'online',
    version: '1.0.0',
    port: process.env.PORT || 5003,
    api: '/api'
  });
});

app.get('/grok', (req, res) => res.sendFile(require('path').join(__dirname, 'public', 'grok.html')));

// Esporta app per i test
module.exports = app;

// Avvia il server solo se non in test
const PORT = process.env.PORT || 5003;
if (require.main === module && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

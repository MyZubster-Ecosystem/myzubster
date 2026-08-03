const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.SERVICE_PORT || 3004;

app.use(cors());
app.use(express.json());

// Connect to dedicated NFT database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster-nfts')
  .then(() => console.log('✅ NFT service connected to MongoDB'))
  .catch(err => console.error('❌ NFT DB error:', err));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'nft',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// NFT routes
const nftRoutes = require('../../src/routes/nftRoutes');
app.use('/', nftRoutes);

// Voting routes
const votingRoutes = require('../../src/routes/votingRoutes');
app.use('/voting', votingRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🖼️  NFT service running on port ${PORT}`);
});

module.exports = app;

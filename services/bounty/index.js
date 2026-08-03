const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.SERVICE_PORT || 3003;

app.use(cors());
app.use(express.json());

// Connect to dedicated bounty database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster-bounties')
  .then(() => console.log('✅ Bounty service connected to MongoDB'))
  .catch(err => console.error('❌ Bounty DB error:', err));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'bounty',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Bounty routes
const bountyRoutes = require('../../src/routes/bountyRoutes');
app.use('/', bountyRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🏆 Bounty service running on port ${PORT}`);
});

module.exports = app;

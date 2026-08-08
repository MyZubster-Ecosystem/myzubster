const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.SERVICE_PORT || 3002;

app.use(cors());
app.use(express.json());

// Connect to dedicated garden database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster-gardens')
  .then(() => console.log('✅ Garden service connected to MongoDB'))
  .catch(err => console.error('❌ Garden DB error:', err));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'garden',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Garden routes
const gardenRoutes = require('../../src/routes/plantRoutes');
app.use('/plants', gardenRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌿 Garden service running on port ${PORT}`);
});

module.exports = app;

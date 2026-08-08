const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.SERVICE_PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to dedicated auth database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster-auth')
  .then(() => console.log('✅ Auth service connected to MongoDB'))
  .catch(err => console.error('❌ Auth DB error:', err));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Auth routes (imported from existing code)
const authRoutes = require('../../src/routes/authRoutes');
app.use('/', authRoutes);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔐 Auth service running on port ${PORT}`);
});

module.exports = app;

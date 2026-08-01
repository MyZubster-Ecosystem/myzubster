require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connessione a MongoDB (senza opzioni deprecate)
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Route
app.use('/api/auth', require('./src/routes/authRoutes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'MyZubster Gateway',
    version: '1.0.0',
    description: 'Monero Payment Gateway & Animal Registry',
    features: {
      payments: process.env.ENABLE_PAYMENTS === 'true',
      animals: process.env.ENABLE_ANIMAL_REGISTRY === 'true',
      plants: process.env.ENABLE_PLANT_REGISTRY === 'true',
      bounty: process.env.ENABLE_BOUNTY_PROGRAM === 'true'
    },
    monero_wallet: process.env.MONERO_MAIN_WALLET_ADDRESS
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MyZubster Gateway',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      info: '/api/info',
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        profile: '/api/auth/profile'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} does not exist`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MyZubster Gateway is running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Info: http://localhost:${PORT}/api/info`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/register`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📡 SIGTERM received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;

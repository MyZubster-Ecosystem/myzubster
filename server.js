// server.js
// MyZubsterGateway Server with FCMP++ Integration

require('dotenv').config();
const express = require('express');
const fcmpRoutes = require('./routes/fcmp');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// FCMP++ Routes
app.use('/api/fcmp', fcmpRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 MyZubsterGateway FCMP++ server running on port ${PORT}`);
    console.log(`📡 FCMP++ API: http://localhost:${PORT}/api/fcmp`);
    console.log(`💚 Health: http://localhost:${PORT}/health`);
  });
}

module.exports = app;
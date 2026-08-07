require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
<<<<<<< HEAD
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
=======
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
>>>>>>> 8dcbf38 (feat: add rate limiting and admin dashboard routes to server.js)

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

<<<<<<< HEAD
// Routes
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
=======
// Route
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/animals', require('./src/routes/animalRoutes'));
app.use('/api/plants', require('./src/routes/plantRoutes'));
app.use('/api/bounties', require('./src/routes/bountyRoutes'));
app.use('/api/admin', require('./src/routes/adminDashboardRoutes'));
const { apiLimiter, authLimiter, paymentLimiter, adminLimiter } = require('./src/middleware/rateLimitMiddleware');
>>>>>>> 8dcbf38 (feat: add rate limiting and admin dashboard routes to server.js)

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bounties', bountyRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminDashboardRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/urban-garden', urbanGardenRoutes);
app.use('/api/carbon-credits', carbonCreditRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ Connected to MongoDB');
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing server...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, closing server...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

module.exports = app;

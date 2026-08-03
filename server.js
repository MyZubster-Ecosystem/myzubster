const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');

// Import routes
const gardenRoutes = require('./routes/gardens');
const photoRoutes = require('./routes/photos');
const reminderRoutes = require('./routes/reminders');
const daoRoutes = require('./routes/dao');

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Garden routes
app.use('/api/gardens', gardenRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/dao', daoRoutes);

// Dashboard API endpoint
app.get('/api/dashboard', (req, res) => {
  res.json({
    success: true,
    services: [
      {
        name: 'telegram',
        status: 'online',
        latency: '120ms',
        description: 'Telegram bot service',
        endpoint: 'http://localhost:3000'
      },
      // ... resto del tuo codice esistente ...
    ]
  });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

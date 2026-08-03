const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.SERVICE_PORT || 3005;

app.use(cors());
app.use(express.json());

// Connect to dedicated notification database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/myzubster-notifications')
  .then(() => console.log('✅ Notification service connected to MongoDB'))
  .catch(err => console.error('❌ Notification DB error:', err));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'notification',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Notification schema
const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  type: { type: String, enum: ['bounty', 'garden', 'nft', 'reminder', 'system'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);

// Get notifications
app.get('/', async (req, res) => {
  try {
    const { userId, unread } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    if (unread === 'true') query.read = false;
    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create notification
app.post('/', async (req, res) => {
  try {
    const { userId, type, title, message, data } = req.body;
    const notification = new Notification({ userId, type, title, message, data });
    await notification.save();
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark as read
app.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔔 Notification service running on port ${PORT}`);
});

module.exports = app;

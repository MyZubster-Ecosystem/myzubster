const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const Message = require('./models/Message');
const User = require('./models/User');
const Order = require('./models/Order');
const Garden = require('./models/Garden');
const locationsRouter = require('./routes/locations');

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/myzubster';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
  });

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'MyZubster backend is running' });
});

app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'senderId, receiverId e content sono obbligatori',
      });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      content: content.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Messaggio inviato',
      data: message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore invio messaggio',
      error: error.message,
    });
  }
});

app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ timestamp: 1 });

    return res.json({
      success: true,
      message: 'Messaggi utente recuperati',
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore recupero messaggi',
      error: error.message,
    });
  }
});

app.get('/api/messages/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    }).sort({ timestamp: 1 });

    return res.json({
      success: true,
      message: 'Chat recuperata',
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore recupero chat',
      error: error.message,
    });
  }
});

app.put('/api/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Messaggio non trovato',
      });
    }

    return res.json({
      success: true,
      message: 'Messaggio segnato come letto',
      data: message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore aggiornamento messaggio',
      error: error.message,
    });
  }
});

app.use('/api/locations', locationsRouter);

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, address, lat, lng } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'name and email are required',
      });
    }

    const user = await User.create({
      name,
      email,
      address,
      location: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'User created',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message,
    });
  }
});

app.put('/api/users/:userId/location', async (req, res) => {
  try {
    const { userId } = req.params;
    const { lat, lng, address } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        ...(lat !== undefined && lng !== undefined ? { location: { lat, lng } } : {}),
        ...(address !== undefined ? { address } : {}),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.json({
      success: true,
      message: 'User location updated',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating user location',
      error: error.message,
    });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { userId, description, address, lat, lng } = req.body;

    if (!userId || !description) {
      return res.status(400).json({
        success: false,
        message: 'userId and description are required',
      });
    }

    const order = await Order.create({
      userId,
      description,
      address,
      location: lat !== undefined && lng !== undefined ? { lat, lng } : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Order created',
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating order',
      error: error.message,
    });
  }
});

app.post('/api/gardens', async (req, res) => {
  try {
    const { name, ownerId, description, address, lat, lng } = req.body;

    if (!name || !ownerId || lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: 'name, ownerId, lat, and lng are required',
      });
    }

    const garden = await Garden.create({
      name,
      ownerId,
      description,
      address,
      location: { lat, lng },
    });

    return res.status(201).json({
      success: true,
      message: 'Garden created',
      data: garden,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating garden',
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`MyZubster backend listening on port ${port}`);
});

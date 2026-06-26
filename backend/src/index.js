const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const Message = require('./models/Message');

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

app.listen(port, () => {
  console.log(`MyZubster backend listening on port ${port}`);
});

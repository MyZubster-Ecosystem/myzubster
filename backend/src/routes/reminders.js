const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');
const { REMINDER_TYPES, FREQUENCIES, CHANNELS } = require('../models/Reminder');

// --- Helpers ---

function computeNextDue(frequency, customIntervalDays, from = new Date()) {
  const d = new Date(from);
  switch (frequency) {
    case 'daily':          d.setDate(d.getDate() + 1); break;
    case 'every_2_days':   d.setDate(d.getDate() + 2); break;
    case 'every_3_days':   d.setDate(d.getDate() + 3); break;
    case 'weekly':         d.setDate(d.getDate() + 7); break;
    case 'biweekly':       d.setDate(d.getDate() + 14); break;
    case 'monthly':        d.setMonth(d.getMonth() + 1); break;
    case 'custom':         d.setDate(d.getDate() + (customIntervalDays || 7)); break;
  }
  return d;
}

// --- CRUD ---

// POST /api/reminders — create reminder
router.post('/', async (req, res) => {
  try {
    const { gardenId, ownerId, plantId, type, frequency, customIntervalDays, channel, notes } = req.body;

    if (!gardenId || !ownerId || !type || !frequency) {
      return res.status(400).json({ success: false, message: 'gardenId, ownerId, type, frequency are required' });
    }
    if (!REMINDER_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type. Allowed: ' + REMINDER_TYPES.join(', ') });
    }
    if (!FREQUENCIES.includes(frequency)) {
      return res.status(400).json({ success: false, message: 'Invalid frequency. Allowed: ' + FREQUENCIES.join(', ') });
    }
    if (channel && !CHANNELS.includes(channel)) {
      return res.status(400).json({ success: false, message: 'Invalid channel. Allowed: ' + CHANNELS.join(', ') });
    }

    const nextDue = computeNextDue(frequency, customIntervalDays);
    const reminder = await Reminder.create({
      gardenId, ownerId, plantId: plantId || null, type, frequency,
      customIntervalDays: customIntervalDays || null,
      nextDue, channel: channel || 'push', notes: notes || '',
    });

    return res.status(201).json({ success: true, data: reminder });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reminders — list reminders (filters: ownerId, gardenId, status, type)
router.get('/', async (req, res) => {
  try {
    const { ownerId, gardenId, status, type, upcoming } = req.query;
    const filter = {};
    if (ownerId) filter.ownerId = ownerId;
    if (gardenId) filter.gardenId = gardenId;
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (upcoming === 'true') {
      filter.nextDue = { $gte: new Date() };
      filter.status = 'pending';
    }

    const reminders = await Reminder.find(filter).sort({ nextDue: 1 });
    return res.json({ success: true, data: reminders, count: reminders.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reminders/upcoming — next 7 days
router.get('/upcoming', async (req, res) => {
  try {
    const { ownerId } = req.query;
    const now = new Date();
    const weekLater = new Date(now);
    weekLater.setDate(weekLater.getDate() + 7);

    const filter = { nextDue: { $gte: now, $lte: weekLater }, status: 'pending' };
    if (ownerId) filter.ownerId = ownerId;

    const reminders = await Reminder.find(filter).sort({ nextDue: 1 });
    return res.json({ success: true, data: reminders, count: reminders.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reminders/history — completed/skipped/missed
router.get('/history', async (req, res) => {
  try {
    const { ownerId, page = 1, limit = 20 } = req.query;
    const filter = { status: { $in: ['completed', 'skipped', 'missed'] } };
    if (ownerId) filter.ownerId = ownerId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Reminder.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(parseInt(limit)),
      Reminder.countDocuments(filter),
    ]);

    return res.json({
      success: true, data: items, count: items.length,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reminders/:id
router.get('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    return res.json({ success: true, data: reminder });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/reminders/:id — update reminder
router.put('/:id', async (req, res) => {
  try {
    const { type, frequency, customIntervalDays, channel, notes, isRecurring } = req.body;
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });

    if (type) reminder.type = type;
    if (frequency) reminder.frequency = frequency;
    if (customIntervalDays !== undefined) reminder.customIntervalDays = customIntervalDays;
    if (channel) reminder.channel = channel;
    if (notes !== undefined) reminder.notes = notes;
    if (isRecurring !== undefined) reminder.isRecurring = isRecurring;

    // Recalculate nextDue if schedule changed
    if (type || frequency || customIntervalDays !== undefined) {
      reminder.nextDue = computeNextDue(reminder.frequency, reminder.customIntervalDays, new Date());
      reminder.status = 'pending';
    }

    await reminder.save();
    return res.json({ success: true, data: reminder });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reminders/:id/complete — mark as done
router.post('/:id/complete', async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });

    reminder.status = reminder.isRecurring ? 'pending' : 'completed';
    reminder.lastCompleted = new Date();
    reminder.history.push({ action: 'completed', at: new Date(), note: req.body.note || '' });

    if (reminder.isRecurring) {
      reminder.nextDue = computeNextDue(reminder.frequency, reminder.customIntervalDays, new Date());
    }

    await reminder.save();
    return res.json({ success: true, data: reminder });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reminders/:id/skip
router.post('/:id/skip', async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });

    reminder.history.push({ action: 'skipped', at: new Date(), note: req.body.note || '' });

    if (reminder.isRecurring) {
      reminder.nextDue = computeNextDue(reminder.frequency, reminder.customIntervalDays, new Date());
    } else {
      reminder.status = 'skipped';
    }

    await reminder.save();
    return res.json({ success: true, data: reminder });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reminders/:id
router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    return res.json({ success: true, message: 'Reminder deleted' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reminders/types — list valid types
router.get('/meta/types', (_req, res) => {
  return res.json({ success: true, data: REMINDER_TYPES });
});

// GET /api/reminders/meta/frequencies
router.get('/meta/frequencies', (_req, res) => {
  return res.json({ success: true, data: FREQUENCIES });
});

module.exports = router;

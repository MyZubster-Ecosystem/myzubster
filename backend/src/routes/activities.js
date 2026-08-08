const express = require('express');
const Activity = require('../models/Activity');

const router = express.Router();

const VALID_TYPES = ['plant_added', 'plant_updated', 'harvest', 'comment'];

// In-memory SSE client registry (minimal real-time, zero extra deps)
const clients = new Set();

function broadcast(activity) {
  const payload = `data: ${JSON.stringify(activity.toJSON())}\n\n`;
  for (const res of clients) {
    try {
      res.write(payload);
    } catch (_) {
      clients.delete(res);
    }
  }
}

// GET /api/activities?garden=&plantType=&type=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { garden, plantType, type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (garden) filter.gardenId = garden;
    if (plantType) filter.plantType = new RegExp(plantType, 'i');
    if (type) {
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ success: false, message: 'Tipo attivita non valido' });
      }
      filter.type = type;
    }

    const take = Math.min(100, parseInt(limit, 10) || 20);
    const skip = Math.max(0, (parseInt(page, 10) - 1) * take);

    const [items, total] = await Promise.all([
      Activity.find(filter).sort({ createdAt: -1 }).skip(skip).limit(take),
      Activity.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      message: 'Attivita recuperate',
      data: items,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        pages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore recupero attivita', error: error.message });
  }
});

// POST /api/activities
router.post('/', async (req, res) => {
  try {
    const { gardenId, plantType, type, actor, message } = req.body;
    if (!type || !VALID_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: 'Tipo attivita obbligatorio e valido' });
    }

    const activity = await Activity.create({
      gardenId: gardenId || undefined,
      plantType: (plantType || '').trim(),
      type,
      actor: {
        id: (actor && actor.id) || '',
        name: (actor && actor.name) || 'Anonimo',
        avatar: (actor && actor.avatar) || '',
      },
      message: (message || '').trim(),
    });

    broadcast(activity);

    return res.status(201).json({ success: true, message: 'Attivita registrata', data: activity });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Errore registrazione attivita', error: error.message });
  }
});

// SSE stream: GET /api/activities/stream
router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('retry: 3000\n\n');
  res.write(': connected\n\n');
  clients.add(res);

  req.on('close', () => {
    clients.delete(res);
  });
});

module.exports = router;

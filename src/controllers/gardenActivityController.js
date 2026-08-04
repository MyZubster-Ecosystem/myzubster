// Garden Activity Feed controller (#92)
// Exposes a REST list, a filter metadata endpoint, and a Server-Sent Events
// stream. The feed works without MongoDB (in-memory generator); when a Mongo
// connection is live, emitted events are best-effort persisted.

const mongoose = require('mongoose');
const Activity = require('../models/Activity');
const feed = require('../utils/gardenActivityFeed');

function isDbConnected() {
  try {
    return mongoose.connection.readyState === 1;
  } catch (e) {
    return false;
  }
}

function toClient(doc) {
  return {
    id: String(doc._id || doc.id),
    type: doc.type,
    actor: doc.actor,
    garden: doc.garden,
    plantType: doc.plantType,
    plantName: doc.plantName,
    message: doc.message,
    timestamp: doc.timestamp
  };
}

function persist(activity) {
  if (!isDbConnected()) return;
  try {
    Activity.create({
      type: activity.type,
      actor: { name: activity.actor.name, avatarColor: activity.actor.avatarColor },
      garden: activity.garden,
      plantType: activity.plantType,
      plantName: activity.plantName,
      message: activity.message,
      timestamp: new Date(activity.timestamp)
    }).catch(() => {});
  } catch (e) {
    /* best-effort only */
  }
}

// GET /api/garden/activity  -> recent items (filtered)
exports.listActivity = async (req, res) => {
  try {
    const filters = feed.cleanFilters(req.query);
    let items;
    if (isDbConnected()) {
      const q = {};
      if (filters.garden) q.garden = filters.garden;
      if (filters.plantType) q.plantType = filters.plantType;
      if (filters.activityType) q.type = filters.activityType;
      const docs = await Activity.find(q).sort({ timestamp: -1 }).limit(50).lean();
      items = docs.map(toClient);
    } else {
      items = feed.getRecent(50, filters);
    }
    res.json({ success: true, count: items.length, data: items });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message, data: [] });
  }
};

// GET /api/garden/activity/filters -> available filter values
exports.getFilters = (req, res) => {
  res.json({
    success: true,
    gardens: feed.GARDENS,
    plantTypes: feed.PLANT_TYPES,
    activityTypes: feed.ACTIVITY_TYPES
  });
};

// GET /api/garden/activity/stream -> SSE
exports.streamActivity = (req, res) => {
  const filters = feed.cleanFilters(req.query);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.flushHeaders && res.flushHeaders();

  const send = (event, payload) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  // Initial snapshot so the client renders history immediately.
  send('snapshot', feed.getRecent(30, filters));

  const interval = setInterval(() => {
    const activity = feed.next(filters);
    persist(activity);
    send('activity', activity);
  }, 4000);

  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
};

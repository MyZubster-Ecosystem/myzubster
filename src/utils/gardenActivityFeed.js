// In-memory garden activity feed generator (#92)
//
// The feed is DB-optional: it always works from an in-memory ring buffer so the
// SSE stream and list endpoints are fully functional even when MongoDB is not
// reachable (e.g. local dev / CI). When a MongoDB connection is available the
// controller best-effort persists each emitted event via the Activity model.

const ACTIVITY_TYPES = ['plant_added', 'plant_updated', 'harvest', 'comment'];
const PLANT_TYPES = ['tree', 'shrub', 'herb', 'vine', 'succulent', 'aquatic', 'other'];

const GARDENS = [
  'Community Garden North',
  'Rooftop Greenhouse',
  'School Garden',
  'Botanical Wing',
  'Riverside Allotment'
];

const ACTORS = [
  { name: 'Maya Lindgren', color: '#10b981' },
  { name: 'Tomas Reyes', color: '#3b82f6' },
  { name: 'Aiko Tanaka', color: '#a855f7' },
  { name: 'Liam O’Brien', color: '#f59e0b' },
  { name: 'Sofia Marchetti', color: '#ec4899' },
  { name: 'Noah Bauer', color: '#14b8a6' },
  { name: 'Priya Nair', color: '#ef4444' },
  { name: 'Hugo Almeida', color: '#8b5cf6' }
];

const PLANT_NAMES = [
  'Tomato', 'Lavender', 'Oak Sapling', 'Mint', 'Aloe', 'Rosemary',
  'Sunflower', 'Boston Fern', 'Basil', 'Jade Plant', 'Marigold', 'Sage'
];

const COMMENTS = [
  'Looking healthy this week!',
  'Needs more sunlight.',
  'Love the new growth 🌿',
  'Should we prune soon?',
  'Great work keeping it watered.'
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const MESSAGE_BUILDERS = {
  plant_added: (a) => `added a new ${a.plantType} “${a.plantName}” to ${a.garden}`,
  plant_updated: (a) => `updated ${a.plantName} in ${a.garden}`,
  harvest: (a) => `harvested ${a.plantName} from ${a.garden}`,
  comment: (a) => `commented on ${a.plantName} in ${a.garden}: “${pick(COMMENTS)}”`
};

let seq = 0;
const recent = [];

function makeActivity(opts = {}) {
  const type = opts.type || pick(ACTIVITY_TYPES);
  const actor = opts.actor || pick(ACTORS);
  const plantType = opts.plantType || pick(PLANT_TYPES);
  const garden = opts.garden || pick(GARDENS);
  const plantName = opts.plantName || pick(PLANT_NAMES);
  const activity = {
    id: `act_${Date.now()}_${seq++}`,
    type,
    actor: { name: actor.name, initials: initials(actor.name), avatarColor: actor.color },
    garden,
    plantType,
    plantName,
    message: (MESSAGE_BUILDERS[type] || (() => ''))({ plantType, plantName, garden }),
    timestamp: new Date().toISOString()
  };
  return activity;
}

// Seed a backlog of historical items so the first snapshot is not empty.
(function seed(n = 24) {
  const now = Date.now();
  for (let i = 0; i < n; i++) {
    const a = makeActivity();
    a.timestamp = new Date(now - (n - i) * randInt(120000, 900000)).toISOString();
    recent.push(a);
  }
})();

function matches(a, filters) {
  if (filters.garden && a.garden !== filters.garden) return false;
  if (filters.plantType && a.plantType !== filters.plantType) return false;
  if (filters.activityType && a.type !== filters.activityType) return false;
  return true;
}

function cleanFilters(f) {
  const out = {};
  if (f.garden) out.garden = f.garden;
  if (f.plantType) out.plantType = f.plantType;
  if (f.activityType) out.activityType = f.activityType;
  return out;
}

function getRecent(limit = 30, filters = {}) {
  const hasFilter = filters.garden || filters.plantType || filters.activityType;
  const arr = hasFilter ? recent.filter((a) => matches(a, filters)) : recent;
  return arr.slice(-limit);
}

// Generate the next activity, biased to match the active filters so a filtered
// stream still produces events. Falls back to a random one after a few tries.
function next(filters = {}) {
  let a = makeActivity();
  let tries = 0;
  while (filters.garden || filters.plantType || filters.activityType) {
    if (matches(a, filters)) break;
    a = makeActivity();
    if (++tries > 12) break;
  }
  recent.push(a);
  if (recent.length > 500) recent.shift();
  return a;
}

module.exports = {
  ACTIVITY_TYPES,
  PLANT_TYPES,
  GARDENS,
  makeActivity,
  getRecent,
  next,
  matches,
  cleanFilters
};

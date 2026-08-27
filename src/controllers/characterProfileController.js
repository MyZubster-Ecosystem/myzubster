const User = require('../models/User');

const ARCHETYPES = ['guardian', 'explorer', 'builder', 'storyteller'];
const ROLES = ['observer', 'contributor', 'verifier', 'mentor'];
const VALUES = ['care', 'truth', 'courage', 'cooperation'];

function normalizeCharacterProfile(input = {}) {
  const name = String(input.name || '').trim();
  const archetype = String(input.archetype || '').trim().toLowerCase();
  const role = String(input.role || '').trim().toLowerCase();
  const guidingValue = String(input.guidingValue || '').trim().toLowerCase();

  if (name.length < 2 || name.length > 40) {
    throw new Error('Il nome del personaggio deve contenere da 2 a 40 caratteri');
  }
  if (!ARCHETYPES.includes(archetype)) throw new Error('Archetipo non valido');
  if (!ROLES.includes(role)) throw new Error('Ruolo non valido');
  if (!VALUES.includes(guidingValue)) throw new Error('Valore guida non valido');

  return { name, archetype, role, guidingValue };
}

exports.getMyCharacter = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('characterProfile').lean();
    if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });
    return res.json({ success: true, character: user.characterProfile || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Impossibile leggere il personaggio' });
  }
};

exports.putMyCharacter = async (req, res) => {
  try {
    const character = normalizeCharacterProfile(req.body);
    const updatedAt = new Date();
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $set: { characterProfile: { ...character, updatedAt } } },
      { new: true, runValidators: true }
    ).select('characterProfile').lean();

    if (!user) return res.status(404).json({ success: false, message: 'Utente non trovato' });
    return res.json({ success: true, character: user.characterProfile });
  } catch (error) {
    const status = /non valid|deve contenere/.test(error.message) ? 400 : 500;
    return res.status(status).json({ success: false, message: error.message || 'Impossibile salvare il personaggio' });
  }
};

exports.normalizeCharacterProfile = normalizeCharacterProfile;
exports.CHARACTER_OPTIONS = { ARCHETYPES, ROLES, VALUES };

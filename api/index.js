// Unified Vercel serverless entry point for the existing MyZubster Express API.
// server.js exports the Express app without starting a listener when required.
const mongoose = require('mongoose');
const app = require('../server');
const MetaverseCharacter = require('../backend/src/models/MetaverseCharacter');

// Temporary, fixed one-shot migration for the participant-authorized N4K48 profile.
// No request parameters are accepted; remove immediately after successful invocation.
app.get('/api/apply-n4k48-once', async (_req, res) => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoUri) return res.status(503).json({ success: false, error: 'Database unavailable' });
    if (mongoose.connection.readyState !== 1) await mongoose.connect(mongoUri);

    const character = await MetaverseCharacter.findOneAndUpdate(
      { identityStatus: 'account-linked', 'github.login': 'nicolaususnicola-lgtm' },
      {
        $set: {
          displayName: 'N4K48',
          characterName: 'N4K48',
          archetype: 'explorer',
          worldId: 'neon-plaza',
          lastSeenAt: new Date()
        }
      },
      { new: true, runValidators: true }
    )
      .select('-_id characterName archetype identityStatus worldId github.login')
      .lean();

    if (!character) {
      return res.status(404).json({ success: false, error: 'Verified Nicola GitHub-linked Metaverse character not found' });
    }

    return res.status(200).json({
      success: true,
      character: {
        characterName: character.characterName,
        archetype: character.archetype,
        identityStatus: character.identityStatus,
        worldId: character.worldId,
        githubLogin: character.github?.login || null
      }
    });
  } catch (error) {
    console.error('One-shot N4K48 migration failed:', error.message);
    return res.status(500).json({ success: false, error: 'Migration failed' });
  }
});

module.exports = app;

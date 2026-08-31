'use strict';

const mongoose = require('mongoose');
const MetaverseCharacter = require('../backend/src/models/MetaverseCharacter');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    return res.status(503).json({ success: false, error: 'Database unavailable' });
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongoUri);
    }

    const character = await MetaverseCharacter.findOneAndUpdate(
      {
        identityStatus: 'account-linked',
        'github.login': 'nicolaususnicola-lgtm'
      },
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
    ).select('-_id characterName archetype identityStatus worldId github.login').lean();

    if (!character) {
      return res.status(404).json({
        success: false,
        error: 'Verified Nicola GitHub-linked Metaverse character not found'
      });
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
};

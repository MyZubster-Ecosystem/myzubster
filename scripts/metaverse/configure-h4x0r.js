'use strict';

/**
 * Configure the verified MyZubster account linked to DanielIoni-creator
 * as the H4x0r Explorer in Neon Plaza.
 *
 * Safety properties:
 * - resolves the account from its verified GitHub identity; no owner/user id is hard-coded
 * - never creates an unverified guest identity
 * - idempotently upserts the account-linked MetaverseCharacter
 * - does not print credentials, tokens, email addresses, or private profile data
 *
 * Usage (from the repository root, with the normal MongoDB environment configured):
 *   node scripts/metaverse/configure-h4x0r.js
 */

const mongoose = require('mongoose');
const User = require('../../src/models/User');
const MetaverseCharacter = require('../../backend/src/models/MetaverseCharacter');

const VERIFIED_GITHUB_LOGIN = 'DanielIoni-creator';
const CHARACTER_NAME = 'H4x0r';
const ARCHETYPE = 'explorer';
const WORLD_ID = 'neon-plaza';

async function main() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI (or MONGO_URI) is required');
  }

  await mongoose.connect(mongoUri);

  const user = await User.findOne({ 'github.login': VERIFIED_GITHUB_LOGIN });
  if (!user || !user.github?.id) {
    throw new Error('Verified GitHub-linked MyZubster account not found; link GitHub before configuring H4x0r');
  }

  const githubId = String(user.github.id);
  const verifiedAt = user.github.verifiedAt || new Date();
  const profileUrl = user.github.profileUrl || `https://github.com/${VERIFIED_GITHUB_LOGIN}`;

  const character = await MetaverseCharacter.findOneAndUpdate(
    {
      $or: [
        { accountUserId: user._id },
        { 'github.id': githubId }
      ]
    },
    {
      $set: {
        displayName: CHARACTER_NAME,
        characterName: CHARACTER_NAME,
        archetype: ARCHETYPE,
        identityStatus: 'account-linked',
        worldId: WORLD_ID,
        createdFrom: 'account-github',
        accountUserId: user._id,
        github: {
          id: githubId,
          login: VERIFIED_GITHUB_LOGIN,
          profileUrl,
          verifiedAt
        },
        lastSeenAt: new Date()
      },
      $setOnInsert: {
        characterId: `account-${String(user._id)}`
      }
    },
    { new: true, upsert: true, runValidators: true }
  );

  console.log(JSON.stringify({
    success: true,
    character: {
      characterId: character.characterId,
      characterName: character.characterName,
      archetype: character.archetype,
      identityStatus: character.identityStatus,
      worldId: character.worldId,
      githubLogin: character.github?.login || null
    }
  }, null, 2));
}

main()
  .catch(error => {
    console.error(`H4x0r configuration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

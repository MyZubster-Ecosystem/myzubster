'use strict';

/**
 * Configure Yassen's MyZubster Metaverse character from an existing
 * verified GitHub-linked MyZubster account.
 *
 * Safety properties:
 * - resolves the account from Yassen's public GitHub login;
 * - never creates an unverified guest identity;
 * - requires an existing GitHub-linked MyZubster account before activation;
 * - idempotently upserts the account-linked MetaverseCharacter;
 * - does not print credentials, tokens, email addresses or private profile data.
 *
 * Usage (from the repository root, with the normal MongoDB environment configured):
 *   npm run metaverse:configure:yassen
 */

const mongoose = require('mongoose');
const User = require('../../src/models/User');
const MetaverseCharacter = require('../../backend/src/models/MetaverseCharacter');

const VERIFIED_GITHUB_LOGIN = 'yassenmainardi';
const CHARACTER_NAME = 'Yassen';
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
    throw new Error('Verified GitHub-linked MyZubster account not found; Yassen must complete the normal GitHub account-link flow before Metaverse activation');
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
    console.error(`Yassen Metaverse configuration failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });

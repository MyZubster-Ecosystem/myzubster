'use strict';

// Curated display assets. Identity verification does not approve contribution
// claims or change the review status of the source character submission.
const CHARACTERS = Object.freeze({
  wasim: Object.freeze({
    key: 'wasim',
    githubLogin: 'wasim-builds',
    githubId: '108329802',
    characterName: 'WASIM',
    avatarUrl: '/images/characters/wasim.svg',
    sourceUrl: 'https://github.com/MyZubster-Ecosystem/myzubster/pull/637',
    reviewStatus: 'proposed'
  })
});

function eligibleChoices(character) {
  if (character?.identityStatus !== 'account-linked' || !character.github?.id) return [];
  const login = String(character.github.login || '').toLowerCase();
  return Object.values(CHARACTERS).filter(choice => choice.githubLogin === login
    && String(character.github.id) === choice.githubId);
}

function publicVisual(character) {
  const choice = CHARACTERS[character?.visualKey];
  if (!choice || character?.identityStatus !== 'account-linked'
      || String(character.github?.id || '') !== choice.githubId
      || String(character.github?.login || '').toLowerCase() !== choice.githubLogin) return {};
  return {
    avatarUrl: choice.avatarUrl,
    characterSourceUrl: choice.sourceUrl,
    characterReviewStatus: choice.reviewStatus
  };
}

module.exports = { eligibleChoices, publicVisual };

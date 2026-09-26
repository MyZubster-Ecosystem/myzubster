const SocialProfile = require('./SocialProfile');
const SocialFollow = require('./SocialFollow');
const Community = require('./Community');
const CommunityMembership = require('./CommunityMembership');
const SocialPost = require('./SocialPost');
const SocialComment = require('./SocialComment');
const SocialReaction = require('./SocialReaction');

describe('MYZ-70 social foundation schemas', () => {
  test('defines the required social foundation models', () => {
    expect(SocialProfile.schema.path('userId').options.unique).toBe(true);
    expect(Community.schema.path('slug').options.unique).toBe(true);
    expect(CommunityMembership.schema.indexes()).toEqual(expect.arrayContaining([
      [{ communityId: 1, userId: 1 }, { unique: true, background: true }]
    ]));
    expect(SocialFollow.schema.indexes().some(([keys, options]) =>
      keys.followerId === 1 && keys.followeeId === 1 && options.unique === true
    )).toBe(true);
    expect(SocialReaction.schema.indexes().some(([keys, options]) =>
      keys.targetType === 1 && keys.targetId === 1 && keys.userId === 1 && keys.kind === 1 && options.unique === true
    )).toBe(true);
  });

  test('mutable social content supports soft deletion', () => {
    for (const model of [SocialProfile, SocialFollow, Community, SocialPost, SocialComment, SocialReaction]) {
      expect(model.schema.path('deletedAt')).toBeDefined();
    }
  });

  test('feed entities expose ownership and relationship fields', () => {
    expect(SocialPost.schema.path('authorId')).toBeDefined();
    expect(SocialComment.schema.path('postId')).toBeDefined();
    expect(SocialReaction.schema.path('targetId')).toBeDefined();
  });
});

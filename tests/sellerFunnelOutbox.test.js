'use strict';
// Unit tests with mocked DB and capture; no external services.
jest.mock('../src/models/SellerFunnelOutbox', () => ({ updateOne:jest.fn(), findOneAndUpdate:jest.fn() }));
const Outbox = require('../src/models/SellerFunnelOutbox');
const { enqueuePublishedListing, drainSellerFunnelOutbox } = require('../src/services/sellerFunnelOutbox');
const listing = { _id:'507f1f77bcf86cd799439011', status:'active', category:'services', currency:'EUR' };
const actor = '507f191e810c19729de860ea';
beforeEach(() => jest.clearAllMocks());
test('enqueue only active persisted listings and uses upsert', async () => {
  Outbox.updateOne.mockResolvedValue({});
  expect(await enqueuePublishedListing({ listing:{...listing,status:'paused'},userId:actor,plan:'SELLER_FREE' })).toEqual({skipped:true});
  expect(Outbox.updateOne).not.toHaveBeenCalled();
  await enqueuePublishedListing({listing,userId:actor,plan:'SELLER_FREE'});
  expect(Outbox.updateOne).toHaveBeenCalledTimes(1);
  expect(Outbox.updateOne.mock.calls[0][2]).toEqual({upsert:true});
  expect(Outbox.updateOne.mock.calls[0][1].$setOnInsert.event).toBe('marketplace_listing_published');
});
test('successful drain marks delivery', async () => {
  const entry = { _id:'id',event:'marketplace_listing_published',actorId:actor,listingId:listing._id,category:'services',currency:'EUR',plan:'SELLER_FREE',attempts:0 };
  Outbox.findOneAndUpdate.mockReturnValueOnce({lean:async()=>({...entry,leaseUntil:new Date('2026-10-16T00:01:00Z')})}).mockReturnValueOnce({lean:async()=>null});
  Outbox.updateOne.mockResolvedValue({});
  const capture = jest.fn().mockResolvedValue({delivered:true});
  expect(await drainSellerFunnelOutbox({capture})).toEqual({attempted:1,delivered:1,deferred:0});
  expect(capture).toHaveBeenCalledTimes(1);
  expect(Outbox.updateOne.mock.calls[0][1].$set.state).toBe('delivered');
});
test('failed capture remains pending with retry delay', async () => {
  const entry = { _id:'id',event:'marketplace_listing_published',actorId:actor,listingId:listing._id,category:'services',currency:'EUR',plan:'SELLER_FREE',attempts:0 };
  Outbox.findOneAndUpdate.mockReturnValueOnce({lean:async()=>({...entry,leaseUntil:new Date('2026-10-16T00:01:00Z')})}).mockReturnValueOnce({lean:async()=>null});
  Outbox.updateOne.mockResolvedValue({});
  expect(await drainSellerFunnelOutbox({capture:async()=>({delivered:false}),now:new Date('2026-10-16T00:00:00Z')})).toEqual({attempted:1,delivered:0,deferred:1});
  expect(Outbox.updateOne.mock.calls[0][1].$inc.attempts).toBe(1);
});

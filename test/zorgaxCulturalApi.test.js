const fs = require('fs');
const path = require('path');
jest.mock('../src/models/CulturalEvent', () => ({ findById: jest.fn(), findOne: jest.fn(), findOneAndUpdate: jest.fn() }));
jest.mock('../src/models/CulturalArtistProfile', () => ({ findById: jest.fn() }));
const CulturalEvent = require('../src/models/CulturalEvent');
const CulturalArtistProfile = require('../src/models/CulturalArtistProfile');
const controller = require('../src/controllers/zorgaxCulturalController');
function response() { const res = { json: jest.fn(), status: jest.fn() }; res.status.mockReturnValue(res); return res; }
beforeEach(() => jest.clearAllMocks());
test('organizer mutations require authentication', () => {
  const routes = fs.readFileSync(path.join(__dirname, '../src/routes/authRoutes.js'), 'utf8');
  expect(routes).toContain("router.post('/zorgax/events', authenticate, zorgaxCulturalController.createEvent)");
  expect(routes).toContain("router.patch('/zorgax/events/:eventId/manage', authenticate, zorgaxCulturalController.updateOrganizerEvent)");
  expect(routes).toContain("router.put('/zorgax/artists/me', authenticate, zorgaxCulturalController.upsertMyArtistProfile)");
});
test.each(['PRIVATE', 'AUTHORIZED_RELEASE'])('public event reads suppress restricted location (%s)', async mode => {
  const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ status: 'ANNOUNCED', location: { mode, publicText: 'hidden location', released: false } }) });
  CulturalEvent.findById.mockReturnValue({ select });
  const res = response();
  await controller.getPublicEvent({ params: { eventId: 'event-1' } }, res);
  expect(select).toHaveBeenCalledWith('-ownerId -location.restrictedText');
  expect(res.json).toHaveBeenCalledWith({ success: true, data: { status: 'ANNOUNCED', location: { mode, publicText: '', released: false } } });
});
test('organizer reads and writes bind the authenticated owner', async () => {
  const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });
  CulturalEvent.findOne.mockReturnValue({ select });
  CulturalEvent.findOneAndUpdate.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
  const req = { user: { _id: 'owner-1' }, params: { eventId: 'event-1' }, body: { ownerId: 'attacker', title: 'Updated' } };
  await controller.getOrganizerEvent(req, response());
  await controller.updateOrganizerEvent(req, response());
  expect(CulturalEvent.findOne).toHaveBeenCalledWith({ _id: 'event-1', ownerId: 'owner-1' });
  expect(CulturalEvent.findOneAndUpdate).toHaveBeenCalledWith({ _id: 'event-1', ownerId: 'owner-1' }, { $set: { title: 'Updated' } }, expect.any(Object));
});
test('public artist reads exclude account ownership', async () => {
  const select = jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue({ stageName: 'Artist' }) });
  CulturalArtistProfile.findById.mockReturnValue({ select });
  await controller.getArtistProfile({ params: { profileId: 'artist-1' } }, response());
  expect(select).toHaveBeenCalledWith('-ownerId');
});

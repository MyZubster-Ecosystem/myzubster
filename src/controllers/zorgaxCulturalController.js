const CulturalEvent = require('../models/CulturalEvent');
const CulturalArtistProfile = require('../models/CulturalArtistProfile');

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.createEvent = async (req, res) => {
  try {
    const body = req.body || {};
    const event = await CulturalEvent.create({ ownerId: req.user._id, title: body.title, description: body.description, culturalTags: body.culturalTags, startsAt: body.startsAt, endsAt: body.endsAt, location: body.location, modules: body.modules, publicInfo: body.publicInfo });
    return res.status(201).json({ success: true, data: event });
  } catch (error) { return res.status(400).json({ success: false, message: 'Unable to create cultural event' }); }
};

exports.getPublicEvent = async (req, res) => {
  try {
    const event = await CulturalEvent.findById(req.params.eventId).select('-location.restrictedText').lean();
    if (!event || ['DRAFT', 'ORGANIZER_REVIEW'].includes(event.status)) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.location && (event.location.mode === 'PRIVATE' || (event.location.mode === 'AUTHORIZED_RELEASE' && !event.location.released))) event.location.publicText = '';
    return res.json({ success: true, data: event });
  } catch (error) { return res.status(400).json({ success: false, message: 'Unable to read event' }); }
};

exports.getOrganizerEvent = async (req, res) => {
  try {
    const event = await CulturalEvent.findOne({ _id: req.params.eventId, ownerId: req.user._id }).select('+location.restrictedText').lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found for this organizer' });
    return res.json({ success: true, data: event });
  } catch (error) { return res.status(400).json({ success: false, message: 'Unable to read organizer event' }); }
};

exports.updateOrganizerEvent = async (req, res) => {
  try {
    const allowed = ['title', 'description', 'culturalTags', 'startsAt', 'endsAt', 'status', 'location', 'modules', 'publicInfo'];
    const update = {};
    for (const key of allowed) if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) update[key] = req.body[key];
    if (update.publicInfo) update['publicInfo.lastOrganizerUpdate'] = new Date();
    const event = await CulturalEvent.findOneAndUpdate({ _id: req.params.eventId, ownerId: req.user._id }, { $set: update }, { new: true, runValidators: true }).select('+location.restrictedText');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found for this organizer' });
    return res.json({ success: true, data: event });
  } catch (error) { return res.status(400).json({ success: false, message: 'Unable to update cultural event' }); }
};

exports.upsertMyArtistProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const allowed = ['stageName', 'bio', 'styles', 'publicRegion', 'musicLinks'];
    const update = { ownerId: req.user._id, claimState: 'CLAIMED' };
    for (const key of allowed) if (Object.prototype.hasOwnProperty.call(body, key)) update[key] = body[key];
    const profile = await CulturalArtistProfile.findOneAndUpdate({ ownerId: req.user._id }, { $set: update }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true });
    return res.json({ success: true, data: profile });
  } catch (error) { return res.status(400).json({ success: false, message: 'Unable to save artist profile' }); }
};

exports.getArtistProfile = async (req, res) => {
  try {
    const profile = await CulturalArtistProfile.findById(req.params.profileId).select('-ownerId').lean();
    if (!profile) return res.status(404).json({ success: false, message: 'Artist profile not found' });
    return res.json({ success: true, data: profile });
  } catch (error) { return res.status(400).json({ success: false, message: 'Unable to read artist profile' }); }
};

exports.searchArtists = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().slice(0, 100);
    const safe = escapeRegex(q);
    const filter = q ? { $or: [{ stageName: { $regex: safe, $options: 'i' } }, { styles: { $elemMatch: { $regex: safe, $options: 'i' } } }, { 'relationships.name': { $regex: safe, $options: 'i' } }] } : {};
    const profiles = await CulturalArtistProfile.find(filter).select('-ownerId').limit(50).lean();
    return res.json({ success: true, data: profiles });
  } catch (error) { return res.status(400).json({ success: false, message: 'Unable to search artists' }); }
};

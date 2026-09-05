const CulturalEvent = require('../models/CulturalEvent');
const CulturalArtistProfile = require('../models/CulturalArtistProfile');

const publicEventProjection = {
  title: 1, description: 1, tags: 1, startsAt: 1, endsAt: 1, status: 1,
  publicMeetingPoint: 1, approximateArea: 1, flyer: 1, timetable: 1,
  enabledModules: 1, updatedAt: 1
};

exports.createEvent = async (req, res) => {
  try {
    const body = req.body || {};
    const event = await CulturalEvent.create({
      title: body.title,
      description: body.description,
      tags: body.tags,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      organizerId: req.user._id,
      locationMode: body.locationMode,
      publicMeetingPoint: body.publicMeetingPoint,
      approximateArea: body.approximateArea,
      privateLocation: body.privateLocation,
      enabledModules: body.enabledModules
    });
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Unable to create cultural event' });
  }
};

exports.getPublicEvent = async (req, res) => {
  try {
    const event = await CulturalEvent.findById(req.params.eventId).select(publicEventProjection).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    return res.json({ success: true, data: event });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Unable to read event' });
  }
};

exports.getOrganizerEvent = async (req, res) => {
  try {
    const event = await CulturalEvent.findOne({ _id: req.params.eventId, organizerId: req.user._id }).lean();
    if (!event) return res.status(404).json({ success: false, message: 'Event not found for this organizer' });
    return res.json({ success: true, data: event });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Unable to read organizer event' });
  }
};

exports.updateOrganizerEvent = async (req, res) => {
  try {
    const allowed = ['title', 'description', 'tags', 'startsAt', 'endsAt', 'status', 'locationMode', 'publicMeetingPoint', 'approximateArea', 'privateLocation', 'locationReleaseApproved', 'flyer', 'timetable', 'enabledModules'];
    const update = {};
    for (const key of allowed) if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) update[key] = req.body[key];
    const event = await CulturalEvent.findOneAndUpdate({ _id: req.params.eventId, organizerId: req.user._id }, { $set: update }, { new: true, runValidators: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found for this organizer' });
    return res.json({ success: true, data: event });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Unable to update cultural event' });
  }
};

exports.upsertMyArtistProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const allowed = ['stageName', 'bio', 'styles', 'publicRegion', 'musicLinks'];
    const update = { claimedByUserId: req.user._id };
    for (const key of allowed) if (Object.prototype.hasOwnProperty.call(body, key)) update[key] = body[key];
    const profile = await CulturalArtistProfile.findOneAndUpdate(
      { claimedByUserId: req.user._id }, { $set: update }, { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.json({ success: true, data: profile });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Unable to save artist profile' });
  }
};

exports.getArtistProfile = async (req, res) => {
  try {
    const profile = await CulturalArtistProfile.findById(req.params.profileId).select('-claimedByUserId').lean();
    if (!profile) return res.status(404).json({ success: false, message: 'Artist profile not found' });
    return res.json({ success: true, data: profile });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Unable to read artist profile' });
  }
};

exports.searchArtists = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const filter = q ? { $or: [{ stageName: { $regex: q, $options: 'i' } }, { styles: { $regex: q, $options: 'i' } }] } : {};
    const profiles = await CulturalArtistProfile.find(filter).select('-claimedByUserId').limit(50).lean();
    return res.json({ success: true, data: profiles });
  } catch (error) {
    return res.status(400).json({ success: false, message: 'Unable to search artists' });
  }
};
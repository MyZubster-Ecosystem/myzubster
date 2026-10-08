const express = require('express');
const mongoose = require('mongoose');
const { authenticate } = require('../middleware/auth');
const PersonalPilot = require('../models/PersonalPilot');
const { normalizePilot, normalizeDevice } = require('../services/personalPilotService');

const router = express.Router();

router.get('/mine', authenticate, async (req, res) => {
  try {
    const pilots = await PersonalPilot.find({ ownerId: req.userId }).sort({ updatedAt: -1 }).limit(30).lean();
    return res.json({ success: true, pilots });
  } catch (_) {
    return res.status(500).json({ success: false, error: 'Impossibile leggere i pilot' });
  }
});

router.post('/', authenticate, async (req, res) => {
  let fields;
  try { fields = normalizePilot(req.body); }
  catch (error) { return res.status(400).json({ success: false, error: error.message }); }
  try {
    if (await PersonalPilot.countDocuments({ ownerId: req.userId }) >= 30) {
      return res.status(409).json({ success: false, error: 'Limite di 30 pilot raggiunto' });
    }
    const pilot = await PersonalPilot.create({ ...fields, ownerId: req.userId });
    return res.status(201).json({ success: true, pilot });
  } catch (_) {
    return res.status(500).json({ success: false, error: 'Impossibile creare il pilot' });
  }
});

router.post('/:id/devices', authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Pilot non valido' });
  let device;
  try { device = normalizeDevice(req.body); }
  catch (error) { return res.status(400).json({ success: false, error: error.message }); }
  try {
    const pilot = await PersonalPilot.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pilot) return res.status(404).json({ success: false, error: 'Pilot non trovato' });
    if (pilot.devices.length >= 20) return res.status(409).json({ success: false, error: 'Limite dispositivi raggiunto' });
    if (pilot.devices.some(item => item.deviceId === device.deviceId)) return res.status(409).json({ success: false, error: 'deviceId già collegato a questo pilot' });
    pilot.devices.push(device);
    await pilot.save();
    return res.status(201).json({ success: true, pilot });
  } catch (_) {
    return res.status(500).json({ success: false, error: 'Impossibile collegare il dispositivo' });
  }
});

router.delete('/:id/devices/:deviceId', authenticate, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: 'Pilot non valido' });
  try {
    const pilot = await PersonalPilot.findOne({ _id: req.params.id, ownerId: req.userId });
    if (!pilot) return res.status(404).json({ success: false, error: 'Pilot non trovato' });
    const before = pilot.devices.length;
    pilot.devices = pilot.devices.filter(item => item.deviceId !== req.params.deviceId);
    if (pilot.devices.length === before) return res.status(404).json({ success: false, error: 'Dispositivo non trovato' });
    await pilot.save();
    return res.json({ success: true, pilot });
  } catch (_) {
    return res.status(500).json({ success: false, error: 'Impossibile scollegare il dispositivo' });
  }
});

module.exports = router;

const express = require('express');
const Municipality = require('../models/Municipality');

const router = express.Router();

function clean(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

router.get('/', async (req, res) => {
  try {
    const rows = await Municipality.find({ lifeStatus: { $ne: 'inactive' } })
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean();
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore lettura registro Comuni', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const name = clean(req.body?.name, 160);
    if (!name) return res.status(400).json({ success: false, message: 'Nome Comune/Ente obbligatorio' });

    const province = clean(req.body?.province, 80);
    const existing = await Municipality.findOne({ name, province });
    if (existing) return res.status(409).json({ success: false, message: 'Comune/Ente già registrato' });

    const row = await Municipality.create({
      name,
      province,
      region: clean(req.body?.region, 100),
      pec: clean(req.body?.pec, 180),
      contactEmail: clean(req.body?.contactEmail, 180),
      website: clean(req.body?.website, 300),
      notes: clean(req.body?.notes, 2000),
      pilotFocus: Array.isArray(req.body?.pilotFocus) ? req.body.pilotFocus.slice(0, 6) : []
    });

    res.status(201).json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Errore registrazione Comune/Ente', error: error.message });
  }
});

module.exports = router;

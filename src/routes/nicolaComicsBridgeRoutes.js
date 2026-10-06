const express = require('express');
const { askNicolaComics } = require('../services/nicolaComicsBridgeService');

const router = express.Router();

router.post('/ask', async (req, res) => {
  try {
    const result = await askNicolaComics({
      question: req.body?.question || req.body?.message,
      action: req.body?.action,
      comicId: req.body?.comic_id
    });
    return res.json({ ok: true, entity: 'ZORGAX-001', pilot: 'nicola-comics', ...result });
  } catch (error) {
    const message = String(error?.message || 'Nicola Comics non disponibile');
    const status = /non supportata|obbligatorio/i.test(message) ? 400 : 502;
    return res.status(status).json({ ok: false, pilot: 'nicola-comics', error: message });
  }
});

module.exports = router;

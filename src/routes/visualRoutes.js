const express = require('express');
const fs = require('fs');
const path = require('path');
const { generateComicImage, VisualImageProviderError } = require('../services/visualImageProvider');

const router = express.Router();
const galleryFile = path.join(__dirname, '../../data/visual-gallery.json');

function readGallery() {
  try {
    if (!fs.existsSync(galleryFile)) return [];
    return JSON.parse(fs.readFileSync(galleryFile, 'utf8'));
  } catch (error) {
    return [];
  }
}

function writeGallery(items) {
  fs.mkdirSync(path.dirname(galleryFile), { recursive: true });
  fs.writeFileSync(galleryFile, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
}

router.post('/generate-image', async (req, res) => {
  try {
    const { character, story } = req.body || {};
    if (!character || !story) {
      return res.status(400).json({ ok: false, error: 'character and story are required' });
    }

    const result = await generateComicImage({ character, story });
    return res.json({ ok: true, image: result });
  } catch (error) {
    if (error instanceof VisualImageProviderError) {
      return res.status(error.statusCode).json({ ok: false, code: error.code, error: error.message });
    }

    const providerStatus = error.response?.status;
    return res.status(providerStatus && providerStatus >= 400 && providerStatus < 600 ? providerStatus : 502).json({
      ok: false,
      code: 'provider_request_failed',
      error: error.response?.data?.error?.message || error.message || 'Image provider request failed',
    });
  }
});

router.get('/gallery', (req, res) => {
  const gallery = readGallery();
  res.json({ ok: true, items: gallery });
});

router.post('/gallery', (req, res) => {
  if (process.env.VISUAL_GALLERY_WRITE_ENABLED !== 'true') {
    return res.status(403).json({
      ok: false,
      error: 'Public gallery publishing is disabled. Set VISUAL_GALLERY_WRITE_ENABLED=true to enable explicit publishing.',
    });
  }

  const { story, character, image_url, image_data_url } = req.body || {};
  if (!story || !character) {
    return res.status(400).json({ ok: false, error: 'story and character are required' });
  }
  if (!character.consent?.public_gallery) {
    return res.status(400).json({ ok: false, error: 'Explicit public gallery consent is required.' });
  }

  const items = readGallery();
  const item = {
    id: story.id || `${character.character_id}-${Date.now()}`,
    title: story.title || `Visual collaboration with ${character.display_name}`,
    character: {
      character_id: character.character_id,
      display_name: character.display_name,
      role: character.role,
      visual_style: character.visual?.style,
    },
    story,
    image_url: image_url || null,
    image_data_url: image_data_url || null,
    status: 'proposal',
    published_at: new Date().toISOString(),
    disclaimer: 'Creative proposal only; not evidence of an approved partnership, endorsement, contract or commitment.',
  };

  const withoutSameId = items.filter(existing => existing.id !== item.id);
  withoutSameId.unshift(item);
  writeGallery(withoutSameId.slice(0, 100));

  res.status(201).json({ ok: true, item });
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Photo = require('../models/Photo');

const router = express.Router();

// Storage config — local disk (swap to S3 adapter later)
const UPLOAD_DIR = path.join(__dirname, '../../uploads/gardens');
const THUMB_DIR = path.join(UPLOAD_DIR, 'thumbnails');

// Ensure dirs exist
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(THUMB_DIR, { recursive: true });

// Multer config
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo immagini sono accettate'), false);
    }
  },
});

// Helper: save buffer to disk
async function saveFile(buffer, filename) {
  const filePath = path.join(UPLOAD_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);
  return filePath;
}

// Helper: generate thumbnail
async function generateThumbnail(buffer, filename) {
  const thumbFilename = `thumb_${filename}`;
  const thumbPath = path.join(THUMB_DIR, thumbFilename);
  await sharp(buffer)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toFile(thumbPath);
  return thumbPath;
}

// POST /api/photos/garden/:gardenId — upload photo(s)
router.post('/garden/:gardenId', upload.array('photos', 10), async (req, res) => {
  try {
    const { gardenId } = req.params;
    const { caption } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Nessuna foto caricata' });
    }

    const savedPhotos = [];

    for (const file of files) {
      const ext = path.extname(file.originalname) || '.jpg';
      const filename = `${uuidv4()}${ext}`;
      const thumbFilename = `thumb_${filename}`;

      // Compress original (max 1920px wide)
      const compressedBuffer = await sharp(file.buffer)
        .resize(1920, null, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();

      // Get metadata
      const metadata = await sharp(compressedBuffer).metadata();

      // Save original
      const filePath = await saveFile(compressedBuffer, filename);

      // Save thumbnail
      const thumbPath = await generateThumbnail(file.buffer, filename);

      const photo = await Photo.create({
        gardenId,
        filename,
        originalName: file.originalname,
        path: `/uploads/gardens/${filename}`,
        thumbnailPath: `/uploads/gardens/thumbnails/${thumbFilename}`,
        mimeType: file.mimetype,
        size: compressedBuffer.length,
        width: metadata.width,
        height: metadata.height,
        caption: caption || '',
        uploadedBy: req.body.uploadedBy || 'anonymous',
      });

      savedPhotos.push(photo);
    }

    return res.status(201).json({
      success: true,
      message: `${savedPhotos.length} foto caricate con successo`,
      data: savedPhotos,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore caricamento foto',
      error: error.message,
    });
  }
});

// GET /api/photos/garden/:gardenId — get gallery for a garden
router.get('/garden/:gardenId', async (req, res) => {
  try {
    const { gardenId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [photos, total] = await Promise.all([
      Photo.find({ gardenId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Photo.countDocuments({ gardenId }),
    ]);

    return res.json({
      success: true,
      data: photos,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore recupero galleria',
      error: error.message,
    });
  }
});

// DELETE /api/photos/:photoId — delete a photo
router.delete('/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ success: false, message: 'Foto non trovata' });
    }

    // Remove files
    const filePath = path.join(__dirname, '../..', photo.path);
    const thumbPath = photo.thumbnailPath ? path.join(__dirname, '../..', photo.thumbnailPath) : null;

    await fs.promises.unlink(filePath).catch(() => {});
    if (thumbPath) await fs.promises.unlink(thumbPath).catch(() => {});

    await Photo.findByIdAndDelete(photoId);

    return res.json({ success: true, message: 'Foto eliminata' });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore eliminazione foto',
      error: error.message,
    });
  }
});

module.exports = router;

/**
 * Service for strict MIME, magic bytes, and sizing validation of user-submitted images.
 * Protects against MIME-spoofing, embedded script uploads, and oversized payloads.
 */

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_IMAGE_SIZE_BYTES = 32;               // Minimum valid header size
const MAX_IMAGES_PER_LISTING = 5;
const MAX_URL_LENGTH = 2048;
const MAX_ALT_LENGTH = 160;

// Magic byte signatures for supported formats
const SIGNATURES = {
  JPEG: [0xFF, 0xD8, 0xFF],
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
};

/**
 * Detects image format based on binary magic numbers.
 * @param {Buffer} buffer - Binary file buffer
 * @returns {{ format: string, mimeType: string, extension: string } | null}
 */
function detectImageFormat(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < MIN_IMAGE_SIZE_BYTES) {
    return null;
  }

  // Check JPEG (FF D8 FF)
  if (
    buffer.length >= 3 &&
    buffer[0] === SIGNATURES.JPEG[0] &&
    buffer[1] === SIGNATURES.JPEG[1] &&
    buffer[2] === SIGNATURES.JPEG[2]
  ) {
    return { format: 'jpeg', mimeType: 'image/jpeg', extension: 'jpg' };
  }

  // Check PNG (89 50 4E 47 0D 0A 1A 0A)
  if (buffer.length >= 8) {
    let isPng = true;
    for (let i = 0; i < SIGNATURES.PNG.length; i++) {
      if (buffer[i] !== SIGNATURES.PNG[i]) {
        isPng = false;
        break;
      }
    }
    if (isPng) {
      return { format: 'png', mimeType: 'image/png', extension: 'png' };
    }
  }

  // Check WebP (RIFF .... WEBP)
  if (buffer.length >= 12) {
    const riff = buffer.toString('ascii', 0, 4);
    const webp = buffer.toString('ascii', 8, 12);
    if (riff === 'RIFF' && webp === 'WEBP') {
      return { format: 'webp', mimeType: 'image/webp', extension: 'webp' };
    }
  }

  return null;
}

/**
 * Validates that an uploaded image buffer matches supported formats, size bounds, and declared MIME type.
 * @param {Buffer} buffer - Image file buffer
 * @param {string} [declaredMimeType] - Content-Type header sent by the client
 * @param {object} [options] - Optional custom bounds
 * @returns {{ valid: boolean, format: string, mimeType: string, extension: string, size: number }}
 */
function validateImageBuffer(buffer, declaredMimeType = '', options = {}) {
  const maxSize = options.maxSizeBytes || MAX_IMAGE_SIZE_BYTES;
  const minSize = options.minSizeBytes || MIN_IMAGE_SIZE_BYTES;

  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    const error = new Error('Nessun dato immagine fornito');
    error.code = 'EMPTY_IMAGE_BUFFER';
    throw error;
  }

  if (buffer.length < minSize) {
    const error = new Error(`File immagine troppo piccolo (minimo ${minSize} byte)`);
    error.code = 'IMAGE_TOO_SMALL';
    throw error;
  }

  if (buffer.length > maxSize) {
    const error = new Error(`File immagine troppo grande (massimo ${Math.round(maxSize / (1024 * 1024))} MB)`);
    error.code = 'IMAGE_TOO_LARGE';
    throw error;
  }

  const detected = detectImageFormat(buffer);
  if (!detected) {
    const error = new Error('Formato immagine non supportato o intestazione binaria non valida (ammessi solo JPEG, PNG, WebP)');
    error.code = 'INVALID_IMAGE_MAGIC_BYTES';
    throw error;
  }

  if (declaredMimeType) {
    const normalizedDeclared = String(declaredMimeType).trim().toLowerCase().split(';')[0];
    if (
      normalizedDeclared !== 'application/octet-stream' &&
      normalizedDeclared !== detected.mimeType &&
      !(normalizedDeclared === 'image/jpg' && detected.mimeType === 'image/jpeg')
    ) {
      const error = new Error(`Tipo MIME dichiarato (${normalizedDeclared}) non corrisponde al formato rilevato (${detected.mimeType})`);
      error.code = 'MIME_TYPE_MISMATCH';
      throw error;
    }
  }

  return {
    valid: true,
    format: detected.format,
    mimeType: detected.mimeType,
    extension: detected.extension,
    size: buffer.length
  };
}

/**
 * Sanitizes and bounds the array of image descriptors for a marketplace listing.
 * @param {Array<object>} images - Array of { url, alt }
 * @param {string} [fallbackAlt] - Fallback alt text
 * @param {object} [options] - Optional validation options
 * @param {string} [options.ownerId] - Current seller ID for verifying local uploaded image ownership
 * @param {boolean} [options.strictPlatformOnly] - When true, only allows uploaded platform storage URLs
 * @returns {Array<{ url: string, alt: string }>}
 */
function normalizeListingImages(images, fallbackAlt = '', options = {}) {
  if (!Array.isArray(images)) {
    return [];
  }

  const expectedOwnerId = options.ownerId ? String(options.ownerId) : null;
  const strictPlatformOnly = Boolean(options.strictPlatformOnly || process.env.MARKETPLACE_STRICT_IMAGE_ORIGIN === 'true');

  return images
    .slice(0, MAX_IMAGES_PER_LISTING)
    .map((item) => {
      const rawUrl = String(item?.url || '').trim();
      const rawAlt = String(item?.alt !== undefined ? item.alt : fallbackAlt).trim();

      if (!rawUrl || rawUrl.length > MAX_URL_LENGTH) {
        return null;
      }

      // Check if URL points to local/platform upload endpoint
      const localMatch = rawUrl.match(/^(?:https?:\/\/[^\/]+)?\/api\/listings\/images\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp))$/i);
      if (localMatch) {
        const imageUserId = localMatch[1];
        // Enforce ownership: prevent referencing another seller's uploaded images
        if (expectedOwnerId && imageUserId !== expectedOwnerId) {
          return null;
        }
        if (options.verifiedUploadUrls) {
          const verifiedSet = options.verifiedUploadUrls instanceof Set
            ? options.verifiedUploadUrls
            : new Set(options.verifiedUploadUrls);
          if (!verifiedSet.has(rawUrl)) {
            return null;
          }
        }
        return {
          url: rawUrl,
          alt: rawAlt.slice(0, MAX_ALT_LENGTH)
        };
      }

      // Check if URL points to Vercel Blob public storage
      const isBlobStorage = /^https:\/\/[a-z0-9_-]+\.public\.blob\.vercel-storage\.com\/marketplace\//i.test(rawUrl);
      if (isBlobStorage) {
        // Enforce owner prefix in blob path: marketplace/:userId/...
        if (expectedOwnerId) {
          const blobUserMatch = rawUrl.match(/\/marketplace\/([a-zA-Z0-9_-]+)\//i);
          if (!blobUserMatch || blobUserMatch[1] !== expectedOwnerId) {
            return null;
          }
        }
        // Require verified server-side upload record bound to the authenticated seller
        if (options.verifiedUploadUrls) {
          const verifiedSet = options.verifiedUploadUrls instanceof Set
            ? options.verifiedUploadUrls
            : new Set(options.verifiedUploadUrls);
          if (!verifiedSet.has(rawUrl)) {
            return null;
          }
        }
        return {
          url: rawUrl,
          alt: rawAlt.slice(0, MAX_ALT_LENGTH)
        };
      }

      // If strict platform-only mode is active, reject arbitrary external URLs
      if (strictPlatformOnly) {
        return null;
      }

      // Allow verified external HTTPS URLs, disallowing loopback/private/internal addresses
      try {
        const parsed = new URL(rawUrl);
        if (parsed.protocol !== 'https:') {
          return null;
        }
        const hostname = parsed.hostname.toLowerCase();
        // Disallow private/internal addresses and localhost
        if (
          hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname === '0.0.0.0' ||
          hostname.endsWith('.local') ||
          hostname.endsWith('.internal') ||
          /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.)/.test(hostname)
        ) {
          return null;
        }

        return {
          url: rawUrl,
          alt: rawAlt.slice(0, MAX_ALT_LENGTH)
        };
      } catch (_) {
        return null;
      }
    })
    .filter(Boolean);
}

module.exports = {
  detectImageFormat,
  validateImageBuffer,
  normalizeListingImages,
  MAX_IMAGE_SIZE_BYTES,
  MIN_IMAGE_SIZE_BYTES,
  MAX_IMAGES_PER_LISTING,
  MAX_URL_LENGTH,
  MAX_ALT_LENGTH
};

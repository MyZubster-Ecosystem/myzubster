import{
  DEMO_SELLERS,
  MARKETPLACE_CATEGORIES,
  MARKETPLACE_COPY,
  demoPaymentMode,
  filterDemoSellers,
  isDemoDeepLink,
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_IMAGES_PER_LISTING,
  validateImageFile,
  normalizeSelectedImages,
  selectCoverImage,
  removeSelectedImage
}from'./MarketplacePage';

describe('Marketplace Demo v2',()=>{
  test('provides at least one demo seller for every category',()=>{const covered=new Set(DEMO_SELLERS.map(s=>s.category));expect(MARKETPLACE_CATEGORIES.filter(c=>!covered.has(c))).toEqual([])});
  test('uses valid categories and unique demo ids',()=>{const allowed=new Set(MARKETPLACE_CATEGORIES),ids=DEMO_SELLERS.map(s=>s.id);expect(DEMO_SELLERS.every(s=>allowed.has(s.category))).toBe(true);expect(new Set(ids).size).toBe(ids.length)});
  test('every demo has a visual, detail content and availability',()=>{expect(DEMO_SELLERS.every(s=>s.icon&&s.description&&s.availability&&Array.isArray(s.details)&&s.details.length)).toBe(true)});
  test('filters demos by category, location, text and payment mode',()=>{expect(filterDemoSellers(DEMO_SELLERS,{category:'pet_adoption'}).map(s=>s.id)).toContain('demo-pet-adoption');expect(filterDemoSellers(DEMO_SELLERS,{location:'Cesena'}).every(s=>s.location.includes('Cesena'))).toBe(true);expect(filterDemoSellers(DEMO_SELLERS,{query:'volontario'}).map(s=>s.id)).toContain('demo-volunteering');expect(filterDemoSellers(DEMO_SELLERS,{payment:'BARTER'}).every(s=>demoPaymentMode(s.price)==='BARTER')).toBe(true)});
  test('specialized community categories expose purpose-specific fields',()=>{for(const category of['volunteering','pet_adoption','pet_lost_found','pet_services']){const demo=DEMO_SELLERS.find(s=>s.category===category);expect(demo.details.length).toBeGreaterThanOrEqual(3)}});
  test('recognizes only the explicit demo deep link',()=>{expect(isDemoDeepLink('?demo=1&utm_source=facebook')).toBe(true);expect(isDemoDeepLink('?demo=0')).toBe(false);expect(isDemoDeepLink('?utm_source=facebook')).toBe(false)});
  test('keeps Spanish, French and German UI copy localized instead of falling back to English',()=>{const keys=['title','intro','seller','activate','active','publish','close','desc','place','price','send','all','filter','refresh','loading','empty','first','request','free','barter','login','published','why','buyer','success','wallet','formTitle','demoNote','demoOffer','demoRequests','demoSearch','demoPayment','demoAllPayments','demoDetails','demoAvailability','demoRequest','demoWarning','demoReview','demoConfirm','demoConfirmed','demoBack','demoLocalReview','noDemoMatches','closeDemo'];for(const lang of['es','fr','de'])for(const key of keys){expect(typeof MARKETPLACE_COPY[lang][key]).toBe('string');expect(MARKETPLACE_COPY[lang][key].trim()).not.toBe('');if(lang==='fr'&&key==='desc')expect(MARKETPLACE_COPY[lang][key]).toBe('Description');else expect(MARKETPLACE_COPY[lang][key]).not.toBe(MARKETPLACE_COPY.en[key])}});
  test('keeps localized benefit lists complete',()=>{for(const lang of['it','es','fr','de'])expect(MARKETPLACE_COPY[lang].benefits).toHaveLength(MARKETPLACE_COPY.en.benefits.length)});
});

describe('Marketplace Photo Upload & Management (Issue #1612)', () => {
  const makeFile = (name, type, sizeBytes) => ({
    name,
    type,
    size: sizeBytes
  });

  describe('validateImageFile', () => {
    test('accepts valid JPEG, PNG, and WebP images within 5MB', () => {
      expect(validateImageFile(makeFile('photo.jpg', 'image/jpeg', 1024 * 100)).valid).toBe(true);
      expect(validateImageFile(makeFile('banner.png', 'image/png', 1024 * 500)).valid).toBe(true);
      expect(validateImageFile(makeFile('preview.webp', 'image/webp', 1024 * 200)).valid).toBe(true);
    });

    test('rejects unsupported image and file types', () => {
      const unsupported = ['image/gif', 'image/svg+xml', 'application/pdf', 'text/html', 'image/bmp'];
      for (const mime of unsupported) {
        const res = validateImageFile(makeFile('file.dat', mime, 2048));
        expect(res.valid).toBe(false);
        expect(res.error).toBe('INVALID_TYPE');
      }
    });

    test('rejects files exceeding 5MB limit', () => {
      const oversized = makeFile('large.jpg', 'image/jpeg', MAX_IMAGE_SIZE_BYTES + 1);
      const res = validateImageFile(oversized);
      expect(res.valid).toBe(false);
      expect(res.error).toBe('SIZE_EXCEEDED');
    });

    test('rejects empty or missing files', () => {
      expect(validateImageFile(null).valid).toBe(false);
      expect(validateImageFile(makeFile('empty.png', 'image/png', 0)).valid).toBe(false);
      expect(validateImageFile(makeFile('empty.png', 'image/png', 0)).error).toBe('EMPTY_FILE');
    });
  });

  describe('normalizeSelectedImages', () => {
    test('enforces max 5 photos per listing and rejects excess', () => {
      const sixFiles = [
        makeFile('1.jpg', 'image/jpeg', 1000),
        makeFile('2.png', 'image/png', 1000),
        makeFile('3.webp', 'image/webp', 1000),
        makeFile('4.jpg', 'image/jpeg', 1000),
        makeFile('5.png', 'image/png', 1000),
        makeFile('6.webp', 'image/webp', 1000)
      ];

      const { images, rejectedCount } = normalizeSelectedImages([], sixFiles);
      expect(images).toHaveLength(MAX_IMAGES_PER_LISTING);
      expect(rejectedCount).toBe(1);
      expect(images[0].isCover).toBe(true);
      expect(images[1].isCover).toBe(false);
    });

    test('filters out invalid MIME types during selection', () => {
      const mixedFiles = [
        makeFile('valid.jpg', 'image/jpeg', 1000),
        makeFile('malicious.svg', 'image/svg+xml', 1000),
        makeFile('valid.png', 'image/png', 1000)
      ];

      const { images, rejectedCount } = normalizeSelectedImages([], mixedFiles);
      expect(images).toHaveLength(2);
      expect(rejectedCount).toBe(1);
      expect(images.map(i => i.file.name)).toEqual(['valid.jpg', 'valid.png']);
    });

    test('respects remaining capacity when adding to existing selection', () => {
      const existing = [
        { file: makeFile('exist1.jpg', 'image/jpeg', 1000), previewUrl: '', url: null, alt: '1', isCover: true },
        { file: makeFile('exist2.jpg', 'image/jpeg', 1000), previewUrl: '', url: null, alt: '2', isCover: false },
        { file: makeFile('exist3.jpg', 'image/jpeg', 1000), previewUrl: '', url: null, alt: '3', isCover: false }
      ];

      const newFiles = [
        makeFile('new1.jpg', 'image/jpeg', 1000),
        makeFile('new2.jpg', 'image/jpeg', 1000),
        makeFile('new3.jpg', 'image/jpeg', 1000) // 6th total, should be rejected
      ];

      const { images, rejectedCount } = normalizeSelectedImages(existing, newFiles);
      expect(images).toHaveLength(5);
      expect(rejectedCount).toBe(1);
    });
  });

  describe('selectCoverImage and removeSelectedImage', () => {
    test('selectCoverImage updates cover flag exclusively to selected index', () => {
      const images = [
        { alt: 'img0', isCover: true },
        { alt: 'img1', isCover: false },
        { alt: 'img2', isCover: false }
      ];

      const updated = selectCoverImage(images, 2);
      expect(updated[0].isCover).toBe(false);
      expect(updated[1].isCover).toBe(false);
      expect(updated[2].isCover).toBe(true);
    });

    test('removeSelectedImage removes target image and reassigns cover if cover was removed', () => {
      const images = [
        { alt: 'img0', isCover: true },
        { alt: 'img1', isCover: false },
        { alt: 'img2', isCover: false }
      ];

      // Remove the cover image (index 0)
      const afterRemoval = removeSelectedImage(images, 0);
      expect(afterRemoval).toHaveLength(2);
      expect(afterRemoval[0].alt).toBe('img1');
      expect(afterRemoval[0].isCover).toBe(true); // Reassigned cover to new first image
    });

    test('removeSelectedImage retains existing cover if non-cover is removed', () => {
      const images = [
        { alt: 'img0', isCover: true },
        { alt: 'img1', isCover: false },
        { alt: 'img2', isCover: false }
      ];

      const afterRemoval = removeSelectedImage(images, 1);
      expect(afterRemoval).toHaveLength(2);
      expect(afterRemoval[0].alt).toBe('img0');
      expect(afterRemoval[0].isCover).toBe(true);
      expect(afterRemoval[1].alt).toBe('img2');
      expect(afterRemoval[1].isCover).toBe(false);
    });
  });

  describe('photo localization copy', () => {
    test('all supported languages have complete photo copy', () => {
      const photoKeys = [
        'photos',
        'uploadPhotos',
        'coverPhoto',
        'setCover',
        'removePhoto',
        'invalidImage',
        'maxPhotosReached',
        'uploading'
      ];

      for (const lang of ['en', 'it', 'es', 'fr', 'de']) {
        for (const key of photoKeys) {
          expect(typeof MARKETPLACE_COPY[lang][key]).toBe('string');
          expect(MARKETPLACE_COPY[lang][key].length).toBeGreaterThan(0);
        }
      }
    });
  });
});

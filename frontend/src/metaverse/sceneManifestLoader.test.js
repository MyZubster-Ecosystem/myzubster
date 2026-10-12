import {
  FALLBACK_SCENE_MANIFEST,
  loadSceneAsset,
  prepareSceneManifest,
  verifySceneAssets,
  versionedAssetUrl
} from './sceneManifestLoader';

const manifest = {
  schemaVersion: '1',
  assetBundleVersion: '42',
  assets: [
    { id: 'plaza', type: 'glb', url: 'https://cdn.example.com/plaza.glb' },
    { id: 'music', type: 'audio', url: 'https://cdn.example.com/music.ogg?v=7' }
  ],
  spawnPoints: [{ id: 'default', position: [0, 0, 0] }],
  interactionZones: [],
  stage: { position: [0, 0, 0], capacity: 1 },
  lighting: { preset: 'day' },
  capabilities: []
};

describe('scene manifest client loader', () => {
  test('adds an asset bundle cache key without replacing explicit versions', () => {
    expect(versionedAssetUrl(manifest.assets[0], '42')).toBe('https://cdn.example.com/plaza.glb?v=42');
    expect(versionedAssetUrl(manifest.assets[1], '42')).toBe('https://cdn.example.com/music.ogg?v=7');
  });

  test('falls back for missing or unsupported manifests', () => {
    const prepared = prepareSceneManifest({ schemaVersion: '2' });
    expect(prepared.mode).toBe('fallback');
    expect(prepared.manifest).toBe(FALLBACK_SCENE_MANIFEST);
    expect(prepared.assets).toEqual([]);
  });

  test('drops insecure asset URLs and keeps the valid scene in degraded mode', () => {
    const prepared = prepareSceneManifest({
      ...manifest,
      assets: [{ id: 'unsafe', type: 'image', url: 'http://example.com/a.png' }]
    });
    expect(prepared.mode).toBe('degraded');
    expect(prepared.assets).toEqual([]);
    expect(prepared.warnings).toContain('Asset unsafe has an invalid URL');
  });

  test('uses fallback mode when a critical 3D asset is unavailable', async () => {
    const prepared = prepareSceneManifest(manifest);
    const result = await verifySceneAssets(prepared, async (url) => ({
      ok: !url.includes('plaza.glb'),
      status: url.includes('plaza.glb') ? 404 : 200
    }));
    expect(result.mode).toBe('fallback');
    expect(result.unavailable.map((asset) => asset.id)).toEqual(['plaza']);
  });

  test('keeps the scene in degraded mode when only an optional asset fails', async () => {
    const prepared = prepareSceneManifest({
      ...manifest,
      assets: [{ id: 'music', type: 'audio', url: 'https://cdn.example.com/music.ogg' }]
    });
    const result = await verifySceneAssets(prepared, async () => ({ ok: false, status: 503 }));
    expect(result.mode).toBe('degraded');
    expect(result.unavailable[0].id).toBe('music');
  });

  test('loads a versioned asset with cache-safe request options', async () => {
    const asset = prepareSceneManifest(manifest).assets[0];
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => 'model/gltf-binary' },
      arrayBuffer: async () => new ArrayBuffer(8)
    }));
    const result = await loadSceneAsset(asset, fetchImpl);
    expect(result).toMatchObject({ id: 'plaza', type: 'glb', contentType: 'model/gltf-binary' });
    expect(fetchImpl).toHaveBeenCalledWith('https://cdn.example.com/plaza.glb?v=42', expect.objectContaining({
      method: 'GET',
      cache: 'force-cache',
      credentials: 'omit'
    }));
  });
});

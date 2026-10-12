export const CLIENT_SCENE_SCHEMA_VERSION = '1';

export const FALLBACK_SCENE_MANIFEST = Object.freeze({
  schemaVersion: CLIENT_SCENE_SCHEMA_VERSION,
  assetBundleVersion: 'fallback',
  assets: [],
  spawnPoints: [{ id: 'fallback', position: [0, 0, 0] }],
  interactionZones: [],
  stage: { position: [0, 0, 0], capacity: 1 },
  lighting: { preset: 'day' },
  capabilities: []
});

function isManifestShape(manifest) {
  return Boolean(
    manifest
    && manifest.schemaVersion === CLIENT_SCENE_SCHEMA_VERSION
    && typeof manifest.assetBundleVersion === 'string'
    && Array.isArray(manifest.assets)
    && Array.isArray(manifest.spawnPoints)
    && manifest.spawnPoints.length > 0
  );
}

export function versionedAssetUrl(asset, assetBundleVersion, baseUrl = window.location.href) {
  const url = new URL(asset.url, baseUrl);
  if (url.protocol !== 'https:') throw new Error('Scene assets must use HTTPS');
  if (!url.searchParams.has('v')) url.searchParams.set('v', assetBundleVersion);
  return url.toString();
}

export function prepareSceneManifest(manifest, baseUrl = window.location.href) {
  if (!isManifestShape(manifest)) {
    return {
      mode: 'fallback',
      manifest: FALLBACK_SCENE_MANIFEST,
      assets: [],
      warnings: ['Manifest missing, malformed, or unsupported']
    };
  }

  const warnings = [];
  const assets = [];
  manifest.assets.forEach((asset) => {
    try {
      assets.push({
        ...asset,
        resolvedUrl: versionedAssetUrl(asset, manifest.assetBundleVersion, baseUrl),
        critical: asset.type === 'gltf' || asset.type === 'glb'
      });
    } catch (_error) {
      warnings.push(`Asset ${asset?.id || 'unknown'} has an invalid URL`);
    }
  });

  return {
    mode: warnings.length ? 'degraded' : 'ready',
    manifest,
    assets,
    warnings
  };
}

export async function verifySceneAssets(prepared, fetchImpl = fetch) {
  if (prepared.mode === 'fallback' || prepared.assets.length === 0) {
    return { ...prepared, checked: true, available: [], unavailable: [] };
  }

  const checks = await Promise.all(prepared.assets.map(async (asset) => {
    try {
      const response = await fetchImpl(asset.resolvedUrl, {
        method: 'HEAD',
        mode: 'cors',
        cache: 'force-cache',
        credentials: 'omit'
      });
      return { asset, available: response.ok, status: response.status };
    } catch (_error) {
      return { asset, available: false, status: 0 };
    }
  }));

  const available = checks.filter((check) => check.available).map((check) => check.asset);
  const unavailable = checks.filter((check) => !check.available).map((check) => check.asset);
  const criticalFailure = unavailable.some((asset) => asset.critical);

  return {
    ...prepared,
    mode: criticalFailure ? 'fallback' : unavailable.length ? 'degraded' : prepared.mode,
    checked: true,
    available,
    unavailable,
    warnings: [
      ...prepared.warnings,
      ...unavailable.map((asset) => `Asset ${asset.id} is unavailable`)
    ]
  };
}

export async function loadSceneAsset(asset, fetchImpl = fetch) {
  const response = await fetchImpl(asset.resolvedUrl, {
    method: 'GET',
    mode: 'cors',
    cache: 'force-cache',
    credentials: 'omit'
  });
  if (!response.ok) throw new Error(`Scene asset request failed (${response.status})`);
  return {
    id: asset.id,
    type: asset.type,
    url: asset.resolvedUrl,
    contentType: response.headers.get('content-type') || '',
    data: await response.arrayBuffer()
  };
}

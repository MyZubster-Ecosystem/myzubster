import {
  WEBXR_STATUS,
  browserCapabilityBaseline,
  detectImmersiveVr
} from './browserCapabilities';

describe('Metaverse browser capabilities', () => {
  test('keeps desktop/mobile access ready without WebXR', () => {
    const checks = browserCapabilityBaseline({
      fetch: () => {},
      localStorage: {},
      CSS: { supports: () => true },
      navigator: { onLine: true }
    });
    expect(checks.every((check) => check.ok)).toBe(true);
  });

  test('reports immersive VR support when the browser confirms it', async () => {
    const result = await detectImmersiveVr({
      xr: { isSessionSupported: jest.fn().mockResolvedValue(true) }
    });
    expect(result).toEqual({ status: WEBXR_STATUS.SUPPORTED, reason: null });
  });

  test('uses non-blocking fallback when WebXR is unavailable', async () => {
    await expect(detectImmersiveVr({})).resolves.toEqual({
      status: WEBXR_STATUS.UNSUPPORTED,
      reason: 'api-unavailable'
    });
  });

  test('converts capability errors into a browser fallback state', async () => {
    const result = await detectImmersiveVr({
      xr: { isSessionSupported: jest.fn().mockRejectedValue(new Error('blocked')) }
    });
    expect(result.status).toBe(WEBXR_STATUS.ERROR);
  });
});

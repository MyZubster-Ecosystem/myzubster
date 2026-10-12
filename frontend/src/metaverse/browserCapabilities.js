export const WEBXR_STATUS = Object.freeze({
  CHECKING: 'checking',
  SUPPORTED: 'supported',
  UNSUPPORTED: 'unsupported',
  ERROR: 'error'
});

export function browserCapabilityBaseline(browser = globalThis) {
  return [
    { label: 'JavaScript', ok: true },
    { label: 'Fetch API', ok: typeof browser.fetch === 'function' },
    { label: 'Storage locale', ok: Boolean(browser.localStorage) },
    { label: 'CSS Grid', ok: Boolean(browser.CSS?.supports?.('display', 'grid')) },
    { label: 'Connessione', ok: browser.navigator?.onLine !== false }
  ];
}

export async function detectImmersiveVr(navigatorLike = globalThis.navigator) {
  if (!navigatorLike?.xr?.isSessionSupported) {
    return { status: WEBXR_STATUS.UNSUPPORTED, reason: 'api-unavailable' };
  }

  try {
    const supported = await navigatorLike.xr.isSessionSupported('immersive-vr');
    return {
      status: supported ? WEBXR_STATUS.SUPPORTED : WEBXR_STATUS.UNSUPPORTED,
      reason: supported ? null : 'session-unsupported'
    };
  } catch (_error) {
    return { status: WEBXR_STATUS.ERROR, reason: 'capability-check-failed' };
  }
}

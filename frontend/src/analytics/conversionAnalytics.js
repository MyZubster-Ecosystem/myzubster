const emittedOnce = new Set();

export function trackConversion(name, data = {}) {
  if (typeof window === 'undefined' || typeof window.va !== 'function') return;
  window.va('event', { name, data });
}

export function trackConversionOnce(name, data = {}) {
  if (typeof window === 'undefined') return;
  const key = `${name}:${JSON.stringify(data)}`;
  if (emittedOnce.has(key)) return;
  emittedOnce.add(key);
  trackConversion(name, data);
}

export function conversionContext(extra = {}) {
  if (typeof window === 'undefined') return extra;
  const params = new URLSearchParams(window.location.search);
  let referrerHost = '';
  try { referrerHost = document.referrer ? new URL(document.referrer).hostname : ''; } catch (_) {}
  return {
    landing_path: window.location.pathname,
    utm_source: params.get('utm_source') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_campaign: params.get('utm_campaign') || '',
    referrer_host: referrerHost,
    ...extra
  };
}

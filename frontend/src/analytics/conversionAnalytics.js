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

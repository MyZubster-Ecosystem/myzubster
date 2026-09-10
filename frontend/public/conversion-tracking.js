(() => {
  const KEY = 'myzubster-attribution-v1';
  const ONCE_PREFIX = 'myzubster-event:';
  const SAFE_PATHS = new Set([
    '/',
    '/zorgax',
    '/social-login',
    '/marketplace',
    '/life-pilot',
    '/fumetto',
    '/metaverse'
  ]);

  const cleanPath = (value) => {
    try {
      const path = new URL(value, window.location.origin).pathname.replace(/\/+$/, '') || '/';
      return SAFE_PATHS.has(path) ? path : 'other';
    } catch (_) {
      return 'other';
    }
  };

  const cleanToken = (value, fallback = 'unknown') => {
    const token = String(value || '').trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').slice(0, 48);
    return token || fallback;
  };

  const detectSource = () => {
    const params = new URLSearchParams(window.location.search);
    const utmSource = cleanToken(params.get('utm_source'), '');
    if (utmSource) return utmSource;
    try {
      const host = new URL(document.referrer).hostname.toLowerCase();
      if (host === 'facebook.com' || host.endsWith('.facebook.com')) return 'facebook';
      if (host === 'google.com' || host.endsWith('.google.com')) return 'google';
      if (host === 'bing.com' || host.endsWith('.bing.com')) return 'bing';
      if (host === 'chatgpt.com' || host.endsWith('.chatgpt.com')) return 'chatgpt';
      if (host === 'github.com' || host.endsWith('.github.com')) return 'github';
      if (host) return 'referral';
    } catch (_) {}
    return 'direct';
  };

  const loadAttribution = () => {
    const params = new URLSearchParams(window.location.search);
    const currentSource = detectSource();
    let previous = {};
    try { previous = JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (_) {}

    const shouldRefresh = Boolean(params.get('utm_source')) || currentSource !== 'direct' || !previous.source;
    const next = shouldRefresh ? {
      source: currentSource,
      campaign: cleanToken(params.get('utm_campaign'), 'none'),
      content: cleanToken(params.get('utm_content'), 'none'),
      landing_path: cleanPath(window.location.href)
    } : previous;

    try { sessionStorage.setItem(KEY, JSON.stringify(next)); } catch (_) {}
    return next;
  };

  const attribution = loadAttribution();

  const emit = (name, data = {}, onceKey = '') => {
    if (onceKey) {
      try {
        const key = ONCE_PREFIX + onceKey;
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
      } catch (_) {}
    }

    if (typeof window.va === 'function') {
      window.va('event', {
        name,
        data: {
          source: attribution.source || 'direct',
          campaign: attribution.campaign || 'none',
          landing_path: attribution.landing_path || 'other',
          ...data
        }
      });
    }
  };

  const currentPath = cleanPath(window.location.href);
  if (currentPath !== 'other') {
    emit('funnel_page_view', { path: currentPath }, `page:${currentPath}`);
  }
  if ((attribution.source || '').includes('facebook')) {
    emit('facebook_landing', { path: currentPath }, `facebook:${currentPath}`);
  }

  const destinationFor = (href) => {
    const path = cleanPath(href);
    const map = {
      '/zorgax': 'zorgax',
      '/social-login': 'social_login',
      '/marketplace': 'marketplace',
      '/life-pilot': 'life_pilot',
      '/fumetto': 'fumetto',
      '/metaverse': 'metaverse'
    };
    return map[path] || null;
  };

  document.addEventListener('click', (event) => {
    const anchor = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    const href = anchor.getAttribute('href') || '';
    if (href.startsWith('/api/auth/social/facebook/start')) {
      emit('funnel_social_login_start', { provider: 'facebook' });
      return;
    }
    const destination = destinationFor(href);
    if (destination) emit('funnel_navigation', { destination });
  }, true);

  if (typeof window.fetch === 'function') {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const input = args[0];
      const rawUrl = typeof input === 'string' ? input : (input && input.url) || '';
      const method = String((args[1] && args[1].method) || (input && input.method) || 'GET').toUpperCase();
      const response = await originalFetch(...args);

      try {
        const path = new URL(rawUrl, window.location.origin).pathname;
        if (path === '/api/zorgax/assistant/chat' && method === 'POST') {
          emit('funnel_zorgax_message', { ok: response.ok ? 'yes' : 'no' });
        } else if (path === '/api/zorgax/assistant/checkout/intent' && method === 'POST') {
          emit('funnel_checkout_started', { ok: response.ok ? 'yes' : 'no' });
        } else if (/^\/api\/zorgax\/assistant\/checkout\/intent\/[^/]+\/verify$/.test(path) && method === 'POST') {
          emit('funnel_checkout_verified', { ok: response.ok ? 'yes' : 'no' });
        } else if (path === '/api/metaverse/world' && response.ok) {
          emit('funnel_metaverse_world_loaded', {}, 'metaverse-world-loaded');
        }
      } catch (_) {}

      return response;
    };
  }
})();

(() => {
  'use strict';

  const EVENT_VIEW = 'darkode_view';
  const EVENT_CLICK = 'darkode_link_click';
  const trackedKey = 'myz_darkode_view_v1';

  function sourceContext() {
    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer || '';
    let referrerHost = '';
    try {
      referrerHost = referrer ? new URL(referrer).hostname : '';
    } catch (_) {}
    return {
      path: window.location.pathname,
      utm_source: params.get('utm_source') || '',
      utm_medium: params.get('utm_medium') || '',
      utm_campaign: params.get('utm_campaign') || '',
      referrer_host: referrerHost
    };
  }

  function track(name, data) {
    if (typeof window.va === 'function') {
      window.va('event', { name, data: data || {} });
    }
  }

  function findDarkodeTarget() {
    const nodes = document.querySelectorAll('h1,h2,h3,h4,p,li,a,figcaption,section,article');
    return Array.from(nodes).find((node) => /darkode/i.test(node.textContent || '')) || null;
  }

  function trackViewOnce(target) {
    if (!target) return;
    let alreadyTracked = false;
    try {
      alreadyTracked = sessionStorage.getItem(trackedKey) === '1';
    } catch (_) {}
    if (alreadyTracked) return;

    const fire = () => {
      track(EVENT_VIEW, sourceContext());
      try { sessionStorage.setItem(trackedKey, '1'); } catch (_) {}
    };

    if (!('IntersectionObserver' in window)) {
      fire();
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35)) {
        fire();
        observer.disconnect();
      }
    }, { threshold: [0.35] });
    observer.observe(target);
  }

  function installClickTracking() {
    document.addEventListener('click', (event) => {
      const anchor = event.target && event.target.closest ? event.target.closest('a') : null;
      if (!anchor) return;
      const label = `${anchor.textContent || ''} ${anchor.getAttribute('href') || ''}`;
      if (!/darkode/i.test(label)) return;
      const context = sourceContext();
      context.destination = anchor.href || '';
      track(EVENT_CLICK, context);
    }, { passive: true });
  }

  function init() {
    trackViewOnce(findDarkodeTarget());
    installClickTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();

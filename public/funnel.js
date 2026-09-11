(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const source = params.get('utm_source') || params.get('source') || 'direct';
  const medium = params.get('utm_medium') || 'web';
  const campaign = params.get('utm_campaign') || 'myzubster';
  const content = params.get('utm_content') || '';

  function track(name, properties) {
    if (typeof window.va === 'function') {
      window.va('event', { name, data: properties || {} });
    }
  }

  const attribution = { source, medium, campaign, content };
  try {
    sessionStorage.setItem('myzubster_attribution', JSON.stringify(attribution));
  } catch (_) {}

  track('funnel_entry', Object.assign({ path: window.location.pathname }, attribution));

  document.addEventListener('click', function (event) {
    const link = event.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const label = (link.dataset.funnel || link.textContent || '').trim().slice(0, 80);
    let step = link.dataset.funnel || 'link_click';
    if (/zorgax/i.test(href)) step = 'zorgax_open';
    else if (/marketplace|listing/i.test(href)) step = 'marketplace_open';
    else if (/payment|checkout|stripe|myz/i.test(href)) step = 'monetization_open';
    else if (/pilot|life/i.test(href)) step = 'pilot_open';
    track(step, Object.assign({ href: href.slice(0, 240), label }, attribution));
  });
})();

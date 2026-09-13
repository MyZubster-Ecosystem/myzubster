import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { startFeaturePageI18n } from './featurePageI18n';

// Guest entry must not depend on browser persistence. Some privacy modes expose
// localStorage but throw on writes/removals. Ignore storage failures only for
// the optional metaverse guest profile; preserve normal storage errors elsewhere.
const METAVERSE_PROFILE_KEY = 'myz-metaverse-profile-v1';
if (typeof Storage !== 'undefined') {
  const nativeSetItem = Storage.prototype.setItem;
  const nativeRemoveItem = Storage.prototype.removeItem;

  Storage.prototype.setItem = function safeSetItem(key, value) {
    try {
      return nativeSetItem.call(this, key, value);
    } catch (error) {
      if (key === METAVERSE_PROFILE_KEY) return undefined;
      throw error;
    }
  };

  Storage.prototype.removeItem = function safeRemoveItem(key) {
    try {
      return nativeRemoveItem.call(this, key);
    } catch (error) {
      if (key === METAVERSE_PROFILE_KEY) return undefined;
      throw error;
    }
  };
}

// Marketplace Demo v2 visuals. Keep this styling scoped to the integrated demo
// so real Marketplace listing cards and transaction flows are unaffected.
const MARKETPLACE_DEMO_IMAGE_BASE = 'https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/main/frontend/public/images/marketplace';
const marketplaceDemoVisualStyle = document.createElement('style');
marketplaceDemoVisualStyle.textContent = `
  section:has(> #demo-sellers-title)::before {
    content: '';
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    margin: 0 0 18px;
    border-radius: 16px;
    border: 1px solid rgba(47, 158, 102, .35);
    background: #f6f9f6 url('${MARKETPLACE_DEMO_IMAGE_BASE}/marketplace-demo-v2.png') center / contain no-repeat;
    box-shadow: 0 12px 34px rgba(0, 0, 0, .12);
  }
  .myz-marketplace-demo-category-overview {
    margin: 0 0 24px;
    padding: clamp(12px, 2.4vw, 18px);
    border: 1px solid rgba(47, 158, 102, .35);
    border-radius: 16px;
    background: rgba(47, 158, 102, .045);
  }
  .myz-marketplace-demo-category-overview h4 {
    margin: 0 0 6px;
    font-size: clamp(1rem, 2vw, 1.2rem);
  }
  .myz-marketplace-demo-category-overview p {
    margin: 0 0 12px;
    opacity: .8;
  }
  .myz-marketplace-demo-category-visual {
    display: block;
    width: 100%;
    height: auto;
    margin: 0 0 14px;
    border-radius: 14px;
    box-shadow: 0 10px 28px rgba(0, 0, 0, .12);
  }
  .myz-marketplace-demo-category-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .myz-marketplace-demo-category-nav button {
    padding: 8px 11px;
    border-radius: 999px;
    border: 1px solid rgba(47, 158, 102, .55);
    background: Canvas;
    color: CanvasText;
    cursor: pointer;
    font: inherit;
  }
  .myz-marketplace-demo-category-nav button:hover,
  .myz-marketplace-demo-category-nav button:focus-visible {
    outline: none;
    border-color: #2f9e66;
    box-shadow: 0 0 0 3px rgba(47, 158, 102, .16);
  }
  @media (max-width: 640px) {
    section:has(> #demo-sellers-title)::before {
      border-radius: 12px;
      margin-bottom: 14px;
    }
    .myz-marketplace-demo-category-overview {
      border-radius: 12px;
    }
    .myz-marketplace-demo-category-nav {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .myz-marketplace-demo-category-nav button {
      width: 100%;
    }
  }
`;
document.head.appendChild(marketplaceDemoVisualStyle);

const MARKETPLACE_DEMO_CATEGORIES = [
  ['', 'All'],
  ['seeds', 'Seeds'],
  ['plants', 'Plants'],
  ['produce', 'Produce'],
  ['clothing', 'Clothing'],
  ['accessories', 'Accessories'],
  ['event_equipment', 'Event equipment'],
  ['tools', 'Tools'],
  ['services', 'Services'],
  ['volunteering', 'Volunteering'],
  ['pet_adoption', 'Pet adoption'],
  ['pet_lost_found', 'Lost & found pets'],
  ['pet_services', 'Pet services']
];

function findMarketplaceCategorySelect() {
  return [...document.querySelectorAll('select')].find(select => {
    const values = [...select.options].map(option => option.value);
    return values.includes('event_equipment') && values.includes('pet_services');
  });
}

function setMarketplaceDemoCategory(value) {
  const select = findMarketplaceCategorySelect();
  if (!select) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
  if (setter) setter.call(select, value);
  else select.value = value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  document.querySelector('#demo-sellers-title')?.closest('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mountMarketplaceDemoCategoryOverview() {
  if (new URLSearchParams(window.location.search).get('demo') !== '1') return;
  const title = document.querySelector('#demo-sellers-title');
  const section = title?.closest('section');
  if (!section || section.querySelector('.myz-marketplace-demo-category-overview')) return;

  const overview = document.createElement('div');
  overview.className = 'myz-marketplace-demo-category-overview';
  overview.setAttribute('aria-label', 'Marketplace demo category explorer');

  const heading = document.createElement('h4');
  heading.textContent = 'Explore demo categories';

  const copy = document.createElement('p');
  copy.textContent = 'Choose a category to filter the live demo cards below. No real order or payment is created.';

  const image = document.createElement('img');
  image.className = 'myz-marketplace-demo-category-visual';
  image.src = `${MARKETPLACE_DEMO_IMAGE_BASE}/marketplace-demo-categories.png`;
  image.alt = 'MyZubster Marketplace Demo category overview';
  image.loading = 'lazy';
  image.decoding = 'async';

  const nav = document.createElement('div');
  nav.className = 'myz-marketplace-demo-category-nav';
  nav.setAttribute('role', 'group');
  nav.setAttribute('aria-label', 'Filter Marketplace Demo by category');

  MARKETPLACE_DEMO_CATEGORIES.forEach(([value, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => setMarketplaceDemoCategory(value));
    nav.appendChild(button);
  });

  overview.append(heading, copy, image, nav);
  const firstContentAfterTitle = title.nextSibling;
  if (firstContentAfterTitle) section.insertBefore(overview, firstContentAfterTitle);
  else section.appendChild(overview);
}

const marketplaceDemoObserver = new MutationObserver(() => mountMarketplaceDemoCategoryOverview());
marketplaceDemoObserver.observe(document.body, { childList: true, subtree: true });
window.requestAnimationFrame(mountMarketplaceDemoCategoryOverview);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
startFeaturePageI18n();

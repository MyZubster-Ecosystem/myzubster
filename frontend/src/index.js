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

// Marketplace Demo v2 visual concept. Keep this scoped to the integrated demo
// section so the image is visible on /marketplace?demo=1 without affecting
// real Marketplace listing cards or transaction flows.
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
    background: #f6f9f6 url('/images/marketplace/marketplace-demo-v2.png') center / contain no-repeat;
    box-shadow: 0 12px 34px rgba(0, 0, 0, .12);
  }
  @media (max-width: 640px) {
    section:has(> #demo-sellers-title)::before {
      border-radius: 12px;
      margin-bottom: 14px;
    }
  }
`;
document.head.appendChild(marketplaceDemoVisualStyle);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
startFeaturePageI18n();

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

import React from 'react';
import { createRoot } from 'react-dom/client';
import ZorgaxGlobalAssistant from './ZorgaxGlobalAssistant';

export function mountZorgaxGlobalAssistant() {
  if (document.getElementById('myzubster-zorgax-global')) return;
  const host = document.createElement('div');
  host.id = 'myzubster-zorgax-global';
  document.body.appendChild(host);
  createRoot(host).render(<ZorgaxGlobalAssistant />);
}

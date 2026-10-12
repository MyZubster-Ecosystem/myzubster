import React, { useEffect, useMemo, useState } from 'react';
import {
  WEBXR_STATUS,
  browserCapabilityBaseline,
  detectImmersiveVr
} from '../metaverse/browserCapabilities';

const XR_COPY = {
  [WEBXR_STATUS.CHECKING]: 'Verifica WebXR in corso…',
  [WEBXR_STATUS.SUPPORTED]: 'WebXR immersivo disponibile',
  [WEBXR_STATUS.UNSUPPORTED]: 'Modalità browser attiva: il visore non è richiesto',
  [WEBXR_STATUS.ERROR]: 'WebXR non verificabile: continua in modalità browser'
};

function MetaverseCapabilityStatus() {
  const checks = useMemo(() => browserCapabilityBaseline(window), []);
  const [xr, setXr] = useState({ status: WEBXR_STATUS.CHECKING, reason: null });

  useEffect(() => {
    let active = true;
    detectImmersiveVr(navigator).then((result) => {
      if (active) setXr(result);
    });
    return () => { active = false; };
  }, []);

  const browserReady = checks.every((check) => check.ok);
  const ready = browserReady && xr.status !== WEBXR_STATUS.CHECKING;

  return (
    <section className="metaverse-panel" aria-live="polite">
      <h3>Requisiti e controllo sistema</h3>
      <div className={`metaverse-readiness ${ready ? 'is-ready' : 'needs-attention'}`}>
        {browserReady ? XR_COPY[xr.status] : 'Alcune funzionalità del browser potrebbero essere limitate'}
      </div>
      <ul className="metaverse-check-list">
        {checks.map((check) => (
          <li key={check.label}><span>{check.ok ? '✅' : '⚠️'}</span>{check.label}</li>
        ))}
        <li>
          <span>{xr.status === WEBXR_STATUS.SUPPORTED ? '✅' : xr.status === WEBXR_STATUS.CHECKING ? '⏳' : 'ℹ️'}</span>
          WebXR immersivo
        </li>
      </ul>
      <details className="metaverse-requirements">
        <summary>Specifiche minime consigliate</summary>
        <p>Browser moderno aggiornato, JavaScript attivo, almeno 2 GB di RAM, schermo da 320 px e connessione stabile da 2 Mbps.</p>
        <p>Non sono richiesti GPU dedicata, visore VR o wallet. Per un’esperienza migliore: 4 GB di RAM e connessione da 5 Mbps.</p>
      </details>
      {xr.status !== WEBXR_STATUS.SUPPORTED && (
        <small className="metaverse-muted">
          Neon Plaza resta accessibile da desktop e mobile. Il controllo WebXR non blocca mai l’ingresso.
        </small>
      )}
    </section>
  );
}

export default MetaverseCapabilityStatus;

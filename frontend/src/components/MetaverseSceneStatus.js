import React, { useEffect, useMemo, useState } from 'react';
import { prepareSceneManifest, verifySceneAssets } from '../metaverse/sceneManifestLoader';

const STATUS_COPY = {
  checking: 'Verifica degli asset in corso…',
  ready: 'Manifest e asset disponibili',
  degraded: 'Scena disponibile con asset opzionali mancanti',
  fallback: 'Scena di fallback attiva'
};

function MetaverseSceneStatus({ room }) {
  const manifestKey = JSON.stringify(room?.sceneManifest || null);
  const prepared = useMemo(
    () => prepareSceneManifest(JSON.parse(manifestKey)),
    [manifestKey]
  );
  const [result, setResult] = useState({ ...prepared, mode: 'checking', checked: false });

  useEffect(() => {
    let active = true;
    setResult({ ...prepared, mode: 'checking', checked: false });
    verifySceneAssets(prepared).then((next) => {
      if (active) setResult(next);
    });
    return () => { active = false; };
  }, [prepared]);

  return (
    <section className="metaverse-panel" aria-live="polite">
      <div className="metaverse-kicker">SCENA VERSIONATA</div>
      <h3>{STATUS_COPY[result.mode]}</h3>
      <p>
        Manifest <strong>v{room?.sceneManifestVersion || '—'}</strong>
        {' · '}bundle <strong>{result.manifest.assetBundleVersion}</strong>
      </p>
      <ul className="metaverse-check-list">
        <li><span>{result.mode === 'fallback' ? '⚠️' : '✅'}</span>Schema {result.manifest.schemaVersion}</li>
        <li><span>📦</span>{result.available?.length || 0} asset disponibili</li>
        <li><span>{result.unavailable?.length ? '⚠️' : '✅'}</span>{result.unavailable?.length || 0} asset non disponibili</li>
      </ul>
      {result.warnings.length > 0 && (
        <details>
          <summary>Dettagli fallback</summary>
          <ul>{result.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
        </details>
      )}
      <small className="metaverse-muted">
        Gli URL degli asset ricevono la versione del bundle come cache key. Un asset 3D critico mancante attiva la scena di fallback; gli asset opzionali degradano l’esperienza senza bloccarla.
      </small>
    </section>
  );
}

export default MetaverseSceneStatus;

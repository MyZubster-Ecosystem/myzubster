import React, { useState } from 'react';
import { createMetaverseRoom } from '../api/metaverse';
import './MetaversePage.css';

function MetaverseRoomCreatePage() {
  const authenticated = Boolean(localStorage.getItem('myzubster-token'));
  const [name, setName] = useState('');
  const [accessPolicy, setAccessPolicy] = useState('authenticated');
  const [capacity, setCapacity] = useState(25);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await createMetaverseRoom({
        name,
        accessPolicy,
        capacity: Number(capacity),
        stagePolicy: 'host-only'
      });
      window.location.assign(`/metaverse/rooms/${encodeURIComponent(result.room.slug || result.room.id)}`);
    } catch (requestError) {
      setError(requestError.status === 401 ? 'Accedi nuovamente per creare una stanza.' : requestError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!authenticated) {
    return <main className="metaverse-entry-shell"><section className="metaverse-entry-card"><h2>Crea una stanza</h2><p>È necessario un account MyZubster.</p><a href="/social-login?returnTo=%2Fmetaverse%2Frooms%2Fnew">Accedi →</a></section></main>;
  }

  return (
    <main className="metaverse-entry-shell">
      <section className="metaverse-entry-card">
        <div className="metaverse-kicker">MYZUBSTER WORLD · HOST</div>
        <h2>Crea una stanza sperimentale</h2>
        <p>La stanza nasce come bozza invisibile. Potrai pubblicarla dalla pagina successiva.</p>
        <form className="metaverse-form" onSubmit={submit}>
          <label>Nome<input required minLength={3} maxLength={120} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Accesso<select value={accessPolicy} onChange={(event) => setAccessPolicy(event.target.value)}><option value="public">Pubblico</option><option value="authenticated">Solo account</option><option value="private">Privato</option></select></label>
          <label>Capacità<input type="number" min="1" max="500" value={capacity} onChange={(event) => setCapacity(event.target.value)} /></label>
          {error && <div className="metaverse-error">{error}</div>}
          <button className="metaverse-primary" type="submit" disabled={busy}>{busy ? 'Creazione…' : 'Crea bozza'}</button>
        </form>
        <p><a href="/metaverse">← Torna a Neon Plaza</a></p>
      </section>
    </main>
  );
}

export default MetaverseRoomCreatePage;

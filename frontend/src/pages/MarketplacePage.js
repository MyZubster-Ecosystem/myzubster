import React, { useEffect, useState } from 'react';

function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/listings')
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.message || payload.error || 'Marketplace non disponibile');
        return payload;
      })
      .then((payload) => {
        if (active) setListings(Array.isArray(payload.listings) ? payload.listings : []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return (
    <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, letterSpacing: 1.4, opacity: 0.7 }}>MYZUBSTER MARKETPLACE</div>
        <h2 style={{ marginBottom: 8 }}>Scambia con la comunità</h2>
        <p style={{ maxWidth: 720 }}>
          Esplora annunci pubblici per semi, piante, prodotti, strumenti, servizi, volontariato e comunità pet.
          Questa è una vetrina pubblica: acquisti e pagamenti non vengono attivati da questa schermata.
        </p>
      </header>

      {loading && <p>Caricamento annunci…</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && listings.length === 0 && (
        <section>
          <h3>Nessun annuncio pubblico per ora</h3>
          <p>Il Marketplace è aperto come vetrina e mostrerà qui i nuovi annunci della comunità.</p>
        </section>
      )}

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {listings.map((listing) => (
          <article key={listing.id} style={{ border: '1px solid rgba(127,127,127,.3)', borderRadius: 12, padding: 16 }}>
            <small>{listing.category}</small>
            <h3>{listing.title}</h3>
            {listing.description && <p>{listing.description}</p>}
            {listing.location && <p>📍 {listing.location}</p>}
            <strong>{listing.currency === 'FREE' ? 'Gratis' : listing.currency === 'BARTER' ? 'Baratto' : `${listing.price} ${listing.currency}`}</strong>
          </article>
        ))}
      </section>
    </main>
  );
}

export default MarketplacePage;

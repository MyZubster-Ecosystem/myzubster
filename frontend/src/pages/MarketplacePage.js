import React, { useCallback, useEffect, useState } from 'react';

const categories = ['seeds','plants','produce','tools','services','volunteering','pet_adoption','pet_lost_found','pet_services'];

function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title:'', category:'services', description:'', location:'', price:'', currency:'FREE' });
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (location) params.set('location', location);
      const response = await fetch(`/api/listings?${params}`);
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || payload.error || 'Marketplace non disponibile');
      setListings(Array.isArray(payload.listings) ? payload.listings : []);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }, [category, location]);

  useEffect(() => { load(); }, [load]);

  async function createListing(event) {
    event.preventDefault(); setMessage('');
    try {
      const body = { ...form, price: ['FREE','BARTER'].includes(form.currency) ? 0 : Number(form.price) };
      const response = await fetch('/api/listings/create', { method:'POST', headers:{ 'Content-Type':'application/json' }, credentials:'include', body:JSON.stringify(body) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || payload.error || 'Accedi per pubblicare un annuncio');
      setMessage('Annuncio pubblicato.'); setShowCreate(false); setForm({ title:'', category:'services', description:'', location:'', price:'', currency:'FREE' }); await load();
    } catch (e) { setMessage(e.message); }
  }

  return <main style={{ padding:24, maxWidth:1100, margin:'0 auto' }}>
    <header style={{ marginBottom:24 }}><div style={{ fontSize:13, letterSpacing:1.4, opacity:.7 }}>MYZUBSTER MARKETPLACE</div><h2>Scambia con la comunità</h2><p>Annunci persistenti per beni, servizi, volontariato, baratto e comunità pet. I pagamenti restano esterni alla vetrina finché il checkout non supera i gate di sicurezza e compliance.</p><button onClick={() => setShowCreate(v => !v)}>{showCreate ? 'Chiudi' : 'Pubblica annuncio'}</button></header>

    {showCreate && <form onSubmit={createListing} style={{ display:'grid', gap:10, padding:16, border:'1px solid rgba(127,127,127,.3)', borderRadius:12, marginBottom:20 }}>
      <input required placeholder="Titolo" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/>
      <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select>
      <textarea placeholder="Descrizione" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/>
      <input placeholder="Località" value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/>
      <select value={form.currency} onChange={e=>setForm({...form,currency:e.target.value})}><option>FREE</option><option>BARTER</option><option>MYZ</option><option>XMR</option><option>TARI</option></select>
      {!['FREE','BARTER'].includes(form.currency) && <input required min="0" step="any" type="number" placeholder="Prezzo" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/>}<button type="submit">Pubblica</button>
    </form>}
    {message && <p role="status">{message}</p>}

    <section style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:20 }}><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">Tutte le categorie</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select><input placeholder="Filtra località" value={location} onChange={e=>setLocation(e.target.value)}/><button onClick={load}>Aggiorna</button></section>
    {loading && <p>Caricamento annunci…</p>}{error && <p role="alert">{error}</p>}
    {!loading && !error && listings.length===0 && <section><h3>Nessun annuncio pubblico per ora</h3><p>Puoi essere il primo a pubblicarne uno.</p></section>}
    <section style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16 }}>{listings.map(listing=><article key={listing.id || listing._id} style={{ border:'1px solid rgba(127,127,127,.3)', borderRadius:12, padding:16 }}><small>{listing.category}</small><h3>{listing.title}</h3>{listing.description&&<p>{listing.description}</p>}{listing.location&&<p>📍 {listing.location}</p>}<strong>{listing.currency==='FREE'?'Gratis':listing.currency==='BARTER'?'Baratto':`${listing.price} ${listing.currency}`}</strong></article>)}</section>
  </main>;
}

export default MarketplacePage;

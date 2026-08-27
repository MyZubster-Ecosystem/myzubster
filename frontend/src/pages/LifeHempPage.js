import React, { useEffect, useMemo, useState } from 'react';
import {
  HEMP_CIRCULAR_CATEGORIES,
  HEMP_COMMERCE_GUARDRAILS,
} from '../data/lifeHempCircularEconomy';

const shell = { padding: 20, maxWidth: 1100, margin: '0 auto' };
const card = { border: '1px solid #d7dee6', borderRadius: 14, padding: 16, background: '#fff' };
const input = { width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #bcc7d1' };

function LifeHempPage() {
  const [summary, setSummary] = useState(null);
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('');
  const [form, setForm] = useState({
    category: 'fiber-textiles',
    title: '',
    description: '',
    territory: '',
    reusedMaterialKg: '',
    avoidedWasteKg: '',
    estimatedCo2eAvoidedKg: '',
    evidenceUrl: '',
  });

  const industrialCategories = useMemo(
    () => HEMP_CIRCULAR_CATEGORIES.filter(category => !category.regulated),
    [],
  );

  async function refresh() {
    try {
      const [summaryResponse, entriesResponse] = await Promise.all([
        fetch('/api/life/hemp/summary'),
        fetch('/api/life/hemp/entries?limit=20'),
      ]);
      const summaryData = await summaryResponse.json();
      const entriesData = await entriesResponse.json();
      if (summaryResponse.ok && summaryData.ok) setSummary(summaryData);
      if (entriesResponse.ok && entriesData.ok) setEntries(entriesData.entries || []);
    } catch (_error) {
      setStatus('Dati Life temporaneamente non disponibili.');
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function submitEntry(event) {
    event.preventDefault();
    const token = localStorage.getItem('myzubster-token');
    if (!token) {
      setStatus('Accedi a MyZubster prima di inviare una voce di riuso.');
      return;
    }
    setStatus('Salvataggio in corso…');
    try {
      const response = await fetch('/api/life/hemp/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Invio non riuscito');
      setStatus('Voce salvata. Resterà privata/non conteggiata nei KPI pubblici finché non viene verificata.');
      setForm({
        category: 'fiber-textiles',
        title: '',
        description: '',
        territory: '',
        reusedMaterialKg: '',
        avoidedWasteKg: '',
        estimatedCo2eAvoidedKg: '',
        evidenceUrl: '',
      });
      refresh();
    } catch (error) {
      setStatus(error.message);
    }
  }

  const totals = summary?.totals || {};

  return (
    <main style={shell}>
      <h1>🌿 Life · Canapa & Circular Economy</h1>
      <p>
        Modulo per riuso della canapa industriale, tracciabilità ambientale e compliance. La categoria cannabinoidi regolamentati è solo un registro di conformità: non abilita vendita, acquisto o distribuzione automatica.
      </p>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, margin: '18px 0' }}>
        <div style={card}><strong>Materiale riusato</strong><div>{Number(totals.reusedMaterialKg || 0).toFixed(1)} kg</div></div>
        <div style={card}><strong>Rifiuto evitato</strong><div>{Number(totals.avoidedWasteKg || 0).toFixed(1)} kg</div></div>
        <div style={card}><strong>CO₂e evitata stimata</strong><div>{Number(totals.estimatedCo2eAvoidedKg || 0).toFixed(1)} kg</div></div>
        <div style={card}><strong>Voci verificate</strong><div>{Number(totals.totalEntries || 0)}</div></div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2>Categorie di riuso</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 10 }}>
          {HEMP_CIRCULAR_CATEGORIES.map(category => (
            <article key={category.id} style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: 12 }}>
              <strong>{category.label}</strong>
              <p>{category.description}</p>
              {category.regulated && <small>Compliance only · commercio automatico disabilitato.</small>}
            </article>
          ))}
        </div>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2>Registra un’attività di riuso industriale</h2>
        <form onSubmit={submitEntry} style={{ display: 'grid', gap: 10 }}>
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={input}>
            {industrialCategories.map(category => <option key={category.id} value={category.id}>{category.label}</option>)}
          </select>
          <input required minLength={3} placeholder="Titolo attività" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={input} />
          <textarea placeholder="Descrizione" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...input, minHeight: 90 }} />
          <input placeholder="Territorio / sito pilota" value={form.territory} onChange={e => setForm({ ...form, territory: e.target.value })} style={input} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
            <input type="number" min="0" step="0.01" placeholder="Materiale riusato kg" value={form.reusedMaterialKg} onChange={e => setForm({ ...form, reusedMaterialKg: e.target.value })} style={input} />
            <input type="number" min="0" step="0.01" placeholder="Rifiuto evitato kg" value={form.avoidedWasteKg} onChange={e => setForm({ ...form, avoidedWasteKg: e.target.value })} style={input} />
            <input type="number" min="0" step="0.01" placeholder="CO₂e evitata stimata kg" value={form.estimatedCo2eAvoidedKg} onChange={e => setForm({ ...form, estimatedCo2eAvoidedKg: e.target.value })} style={input} />
          </div>
          <input type="url" placeholder="URL evidenza (opzionale)" value={form.evidenceUrl} onChange={e => setForm({ ...form, evidenceUrl: e.target.value })} style={input} />
          <button type="submit">Invia per verifica</button>
          {status && <div>{status}</div>}
        </form>
      </section>

      <section style={{ ...card, marginBottom: 16 }}>
        <h2>Attività verificate</h2>
        {entries.length === 0 ? <p>Nessuna attività verificata ancora.</p> : entries.map(entry => (
          <article key={entry._id} style={{ borderTop: '1px solid #e2e8f0', padding: '12px 0' }}>
            <strong>{entry.title}</strong>
            <div>{entry.territory || 'Territorio non indicato'} · {entry.category}</div>
            <small>{Number(entry.reusedMaterialKg || 0)} kg riusati · {Number(entry.avoidedWasteKg || 0)} kg rifiuto evitato</small>
          </article>
        ))}
      </section>

      <section style={card}>
        <h2>Compliance prodotti regolamentati</h2>
        <p>
          Operatori e licenze vengono gestiti in un registro amministrativo. Il portale pubblico mostra solo conteggi di conformità e non un elenco di venditori o punti vendita.
        </p>
        <ul>
          <li>Commercio regolamentato attivo di default: {String(HEMP_COMMERCE_GUARDRAILS.regulatedProductsDefaultEnabled)}</li>
          <li>Verifica operatore richiesta: {String(HEMP_COMMERCE_GUARDRAILS.requireVerifiedOperator)}</li>
          <li>Controllo giurisdizione/licenza richiesto: {String(HEMP_COMMERCE_GUARDRAILS.requireJurisdictionCheck && HEMP_COMMERCE_GUARDRAILS.requireLicenseCheck)}</li>
          <li>Operatori verificati registrati: {Number(summary?.compliance?.verifiedOperatorCount || 0)}</li>
        </ul>
      </section>
    </main>
  );
}

export default LifeHempPage;

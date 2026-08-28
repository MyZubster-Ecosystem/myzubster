import React, { useCallback, useEffect, useState } from 'react';

function headers(extra = {}) {
  const token = localStorage.getItem('myzubster-token');
  return { ...extra, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, headers: headers(options.headers || {}) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || payload.error || 'Operazione non riuscita');
  return payload;
}

function MarketplaceOpsPage() {
  const [orders, setOrders] = useState([]);
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [moderationAvailable, setModerationAvailable] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setStatus('');
    try {
      const orderPayload = await requestJson('/api/marketplace/orders/mine');
      setOrders(Array.isArray(orderPayload.orders) ? orderPayload.orders : []);
      try {
        const reportPayload = await requestJson('/api/marketplace/moderation/reports?status=OPEN');
        setReports(Array.isArray(reportPayload.reports) ? reportPayload.reports : []);
        setModerationAvailable(true);
      } catch (error) {
        if (/moderazione|permessi/i.test(error.message)) {
          setModerationAvailable(false);
          setReports([]);
        } else {
          throw error;
        }
      }
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateOrder(order, nextStatus) {
    try {
      await requestJson(`/api/marketplace/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      setStatus(`Richiesta aggiornata: ${nextStatus}`);
      await load();
    } catch (error) { setStatus(error.message); }
  }

  async function leaveReview(order) {
    const score = Number(window.prompt('Punteggio 1-5', '5'));
    if (!Number.isInteger(score) || score < 1 || score > 5) return;
    const comment = window.prompt('Commento opzionale', '') || '';
    try {
      await requestJson('/api/marketplace/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order._id, score, comment })
      });
      setStatus('Recensione salvata.');
    } catch (error) { setStatus(error.message); }
  }

  async function moderate(report, listingAction, reportStatus) {
    const reviewNote = window.prompt('Nota moderazione opzionale', '') || '';
    try {
      await requestJson(`/api/marketplace/moderation/reports/${report._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: reportStatus, listingAction, reviewNote })
      });
      setStatus('Decisione di moderazione registrata.');
      await load();
    } catch (error) { setStatus(error.message); }
  }

  return <main style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>
    <header style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, letterSpacing: 1.4, opacity: .7 }}>MARKETPLACE OPERATIONS</div>
      <h2>Le mie richieste e vendite</h2>
      <p>Qui gestisci gli scambi non-custodial. Nessuna azione in questa pagina trasferisce denaro o conferma un pagamento.</p>
      <button onClick={load}>Aggiorna</button>
    </header>
    {status && <p role="status">{status}</p>}
    {loading && <p>Caricamento…</p>}

    {!loading && <section style={{ display: 'grid', gap: 12 }}>
      {orders.length === 0 && <p>Nessuna richiesta per ora.</p>}
      {orders.map(order => <article key={order._id} style={{ border: '1px solid rgba(127,127,127,.3)', borderRadius: 12, padding: 16 }}>
        <strong>{order.snapshot?.title || order.listingId?.title || 'Annuncio'}</strong>
        <p>Stato: {order.status} · Quantità: {order.quantity}</p>
        <p>{order.snapshot?.currency === 'FREE' ? 'Gratis' : order.snapshot?.currency === 'BARTER' ? 'Baratto' : `${order.snapshot?.price || 0} ${order.snapshot?.currency || ''}`}</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {order.status === 'REQUESTED' && <><button onClick={()=>updateOrder(order,'ACCEPTED')}>Accetta</button><button onClick={()=>updateOrder(order,'REJECTED')}>Rifiuta</button><button onClick={()=>updateOrder(order,'CANCELLED')}>Annulla</button></>}
          {order.status === 'ACCEPTED' && <><button onClick={()=>updateOrder(order,'COMPLETED')}>Completa</button><button onClick={()=>updateOrder(order,'CANCELLED')}>Annulla</button></>}
          {order.status === 'COMPLETED' && <button onClick={()=>leaveReview(order)}>Lascia recensione</button>}
        </div>
      </article>)}
    </section>}

    {moderationAvailable && <section style={{ marginTop: 32 }}>
      <h2>Moderazione</h2>
      <p>Visibile solo a ruoli admin/moderator. Le azioni vengono registrate sulla segnalazione.</p>
      {reports.length === 0 && <p>Nessuna segnalazione aperta.</p>}
      <div style={{ display:'grid', gap:12 }}>{reports.map(report => <article key={report._id} style={{ border:'1px solid rgba(127,127,127,.3)', borderRadius:12, padding:16 }}>
        <strong>{report.listingId?.title || 'Annuncio'}</strong>
        <p>Motivo: {report.reason}</p>
        {report.details && <p>{report.details}</p>}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={()=>moderate(report,'pause','RESOLVED')}>Metti in pausa</button>
          <button onClick={()=>moderate(report,'close','RESOLVED')}>Chiudi annuncio</button>
          <button onClick={()=>moderate(report,'none','DISMISSED')}>Archivia segnalazione</button>
        </div>
      </article>)}</div>
    </section>}
  </main>;
}

export default MarketplaceOpsPage;

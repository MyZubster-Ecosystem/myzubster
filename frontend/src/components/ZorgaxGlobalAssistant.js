import React, { useMemo, useState } from 'react';

const quickActions = [
  ['Marketplace', '/marketplace'],
  ['LIFE Pilot', '/life-pilot'],
  ['Metaverso', '/metaverse'],
  ['Community', '/repositories'],
];

export default function ZorgaxGlobalAssistant({ embedded = false }) {
  const [open, setOpen] = useState(embedded);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Ciao! Sono Zorgax. Dimmi cosa vuoi fare e ti accompagno nel punto giusto di MyZubster.' },
  ]);
  const [busy, setBusy] = useState(false);
  const page = useMemo(() => window.location.pathname || '/', []);

  async function send(e) {
    e?.preventDefault();
    const text = message.trim();
    if (!text || busy) return;
    setMessage('');
    setMessages((items) => [...items, { role: 'user', text }]);
    setBusy(true);
    try {
      const token = localStorage.getItem('myzubster-token');
      const response = await fetch('/api/zorgax/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, context: { page, source: embedded ? 'home' : 'global' } }),
      });
      const data = await response.json();
      const answer = data.answer || data.message || data.reply || 'Posso accompagnarti nelle sezioni di MyZubster.';
      setMessages((items) => [...items, { role: 'assistant', text: answer }]);
    } catch (_) {
      setMessages((items) => [...items, { role: 'assistant', text: 'Il collegamento con Zorgax non e disponibile in questo momento. Puoi comunque usare i percorsi rapidi qui sotto.' }]);
    } finally {
      setBusy(false);
    }
  }

  const panel = (
    <section aria-label="Zorgax assistant" style={{
      width: embedded ? 'auto' : 'min(420px, calc(100vw - 28px))',
      maxWidth: embedded ? 900 : 420,
      margin: embedded ? '18px 20px 24px' : 0,
      padding: 18,
      borderRadius: 18,
      border: '1px solid rgba(168,85,247,.55)',
      background: 'linear-gradient(145deg,rgba(22,18,38,.98),rgba(10,24,34,.98))',
      color: '#fff',
      boxShadow: '0 16px 45px rgba(0,0,0,.32)',
    }}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}>
        <div><strong>ZORGAX · COPILOTA MYZUBSTER</strong><div style={{fontSize:12,opacity:.72}}>Contesto: {page}</div></div>
        {!embedded && <button onClick={() => setOpen(false)} aria-label="Chiudi Zorgax" style={{border:0,background:'transparent',color:'#fff',fontSize:22,cursor:'pointer'}}>x</button>}
      </div>
      <div aria-live="polite" style={{margin:'14px 0',maxHeight:embedded?300:260,overflowY:'auto',display:'grid',gap:8}}>
        {messages.map((item, index) => <div key={index} style={{padding:'9px 11px',borderRadius:12,background:item.role==='user'?'rgba(59,130,246,.22)':'rgba(168,85,247,.18)'}}><b>{item.role==='user'?'Tu':'Zorgax'}:</b> {item.text}</div>)}
        {busy && <div style={{opacity:.7}}>Zorgax sta pensando...</div>}
      </div>
      <form onSubmit={send} style={{display:'flex',gap:8}}>
        <input value={message} onChange={(e)=>setMessage(e.target.value)} placeholder="Cosa vuoi fare su MyZubster?" aria-label="Messaggio per Zorgax" style={{flex:1,minWidth:0,padding:'12px',borderRadius:10,border:'1px solid #5b4b78',background:'#111827',color:'#fff'}} />
        <button disabled={busy} type="submit" style={{padding:'11px 14px',borderRadius:10,border:0,fontWeight:900,cursor:'pointer'}}>Invia</button>
      </form>
      <nav aria-label="Percorsi rapidi Zorgax" style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:12}}>
        {quickActions.map(([label,href]) => <a key={href} href={href} style={{padding:'8px 10px',borderRadius:999,border:'1px solid rgba(255,255,255,.3)',color:'#fff',textDecoration:'none',fontSize:13,fontWeight:800}}>{label}</a>)}
      </nav>
    </section>
  );

  if (embedded) return panel;
  return <>
    {open && <div style={{position:'fixed',right:14,bottom:76,zIndex:1200}}>{panel}</div>}
    <button onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label="Apri Zorgax" style={{position:'fixed',right:14,bottom:14,zIndex:1201,borderRadius:999,border:'1px solid rgba(168,85,247,.65)',padding:'12px 16px',fontWeight:900,cursor:'pointer',boxShadow:'0 8px 28px rgba(0,0,0,.28)'}}>👽 Zorgax</button>
  </>;
}

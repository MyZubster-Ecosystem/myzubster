import React,{useCallback,useEffect,useMemo,useRef,useState} from 'react';

const COPY={
  it:{title:'Richieste e messaggi',incoming:'Richieste ricevute',outgoing:'Le mie richieste',refresh:'Aggiorna richieste',loading:'Caricamento…',empty:'Nessuna richiesta presente.',unread:'messaggi non letti',pending:'richieste da valutare',messages:'Messaggi',close:'Chiudi',conversation:'Conversazione',send:'Invia messaggio',sending:'Invio…',write:'Scrivi un messaggio',noMessages:'Nessun messaggio. Scrivi per iniziare la conversazione.',closed:'Questa conversazione è chiusa.',accept:'Accetta',reject:'Rifiuta',cancel:'Annulla richiesta',confirm:'Confermi questa modifica alla richiesta?',missing:'La richiesta non è stata trovata. Aggiorna le richieste e riprova.',loadError:'Impossibile caricare le richieste.',chatError:'Conversazione non disponibile.',sendError:'Messaggio non inviato.',unreadError:'Notifiche non disponibili. Aggiorna per riprovare.',status:'Stato',REQUESTED:'In attesa',ACCEPTED:'Accettata',REJECTED:'Rifiutata',CANCELLED:'Annullata',COMPLETED:'Completata'},
  en:{title:'Requests and messages',incoming:'Incoming requests',outgoing:'My requests',refresh:'Refresh requests',loading:'Loading…',empty:'No requests yet.',unread:'unread messages',pending:'requests to review',messages:'Messages',close:'Close',conversation:'Conversation',send:'Send message',sending:'Sending…',write:'Write a message',noMessages:'No messages yet. Write to start the conversation.',closed:'This conversation is closed.',accept:'Accept',reject:'Decline',cancel:'Cancel request',confirm:'Confirm this request change?',missing:'Request not found. Refresh requests and try again.',loadError:'Could not load requests.',chatError:'Conversation unavailable.',sendError:'Message not sent.',unreadError:'Notifications unavailable. Refresh to retry.',status:'Status',REQUESTED:'Pending',ACCEPTED:'Accepted',REJECTED:'Declined',CANCELLED:'Cancelled',COMPLETED:'Completed'},
  es:{title:'Solicitudes y mensajes',incoming:'Solicitudes recibidas',outgoing:'Mis solicitudes',refresh:'Actualizar solicitudes',loading:'Cargando…',empty:'No hay solicitudes.',unread:'mensajes sin leer',pending:'solicitudes por revisar',messages:'Mensajes',close:'Cerrar',conversation:'Conversación',send:'Enviar mensaje',sending:'Enviando…',write:'Escribe un mensaje',noMessages:'No hay mensajes. Escribe para iniciar la conversación.',closed:'Esta conversación está cerrada.',accept:'Aceptar',reject:'Rechazar',cancel:'Cancelar solicitud',confirm:'¿Confirmas este cambio?',missing:'Solicitud no encontrada. Actualiza e inténtalo de nuevo.',loadError:'No se pudieron cargar las solicitudes.',chatError:'Conversación no disponible.',sendError:'Mensaje no enviado.',unreadError:'Notificaciones no disponibles. Actualiza para reintentar.',status:'Estado',REQUESTED:'Pendiente',ACCEPTED:'Aceptada',REJECTED:'Rechazada',CANCELLED:'Cancelada',COMPLETED:'Completada'},
  fr:{title:'Demandes et messages',incoming:'Demandes reçues',outgoing:'Mes demandes',refresh:'Actualiser les demandes',loading:'Chargement…',empty:'Aucune demande.',unread:'messages non lus',pending:'demandes à examiner',messages:'Messages',close:'Fermer',conversation:'Conversation',send:'Envoyer le message',sending:'Envoi…',write:'Écrivez un message',noMessages:'Aucun message. Écrivez pour commencer la conversation.',closed:'Cette conversation est fermée.',accept:'Accepter',reject:'Refuser',cancel:'Annuler la demande',confirm:'Confirmer cette modification ?',missing:'Demande introuvable. Actualisez et réessayez.',loadError:'Impossible de charger les demandes.',chatError:'Conversation indisponible.',sendError:'Message non envoyé.',unreadError:'Notifications indisponibles. Actualisez pour réessayer.',status:'Statut',REQUESTED:'En attente',ACCEPTED:'Acceptée',REJECTED:'Refusée',CANCELLED:'Annulée',COMPLETED:'Terminée'},
  de:{title:'Anfragen und Nachrichten',incoming:'Eingehende Anfragen',outgoing:'Meine Anfragen',refresh:'Anfragen aktualisieren',loading:'Wird geladen…',empty:'Keine Anfragen vorhanden.',unread:'ungelesene Nachrichten',pending:'zu prüfende Anfragen',messages:'Nachrichten',close:'Schließen',conversation:'Unterhaltung',send:'Nachricht senden',sending:'Wird gesendet…',write:'Nachricht schreiben',noMessages:'Keine Nachrichten. Schreibe, um die Unterhaltung zu beginnen.',closed:'Diese Unterhaltung ist geschlossen.',accept:'Akzeptieren',reject:'Ablehnen',cancel:'Anfrage abbrechen',confirm:'Diese Änderung bestätigen?',missing:'Anfrage nicht gefunden. Aktualisiere und versuche es erneut.',loadError:'Anfragen konnten nicht geladen werden.',chatError:'Unterhaltung nicht verfügbar.',sendError:'Nachricht nicht gesendet.',unreadError:'Benachrichtigungen nicht verfügbar. Bitte aktualisieren.',status:'Status',REQUESTED:'Ausstehend',ACCEPTED:'Akzeptiert',REJECTED:'Abgelehnt',CANCELLED:'Abgebrochen',COMPLETED:'Abgeschlossen'}
};
function headers(json=false){return{Authorization:`Bearer ${localStorage.getItem('myzubster-token')||''}`,...(json?{'Content-Type':'application/json'}:{})};}
async function api(url,options={}){
  const res=await fetch(url,{...options,headers:headers(Boolean(options.body))});
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data.message||data.error||`HTTP ${res.status}`);
  return data;
}
const box={border:'1px solid #777',borderRadius:12,padding:14,margin:'12px 0',overflowWrap:'anywhere'};

export default function MarketplaceInbox({lang='it',requestTarget=null}){
  const t=COPY[lang]||COPY.en;
  const[orders,setOrders]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
  const[unread,setUnread]=useState(null),[unreadError,setUnreadError]=useState(false);
  const[chatId,setChatId]=useState(null),[messages,setMessages]=useState([]),[chatLoading,setChatLoading]=useState(false),[chatError,setChatError]=useState(''),[text,setText]=useState(''),[sending,setSending]=useState(false),[busy,setBusy]=useState(null);
  const sectionRef=useRef(null),chatRef=useRef(null),sessionRef=useRef(0),sendRef=useRef(false),targetRef=useRef(0),ordersRef=useRef(0),unreadRef=useRef(0),readRef=useRef(0);
  const selected=useMemo(()=>orders.find(o=>String(o._id)===chatId),[orders,chatId]);
  const loadOrders=useCallback(async()=>{
    const seq=++ordersRef.current;setLoading(true);setError('');
    try{const d=await api('/api/marketplace/orders/mine');const rows=Array.isArray(d.orders)?d.orders:[];if(seq===ordersRef.current)setOrders(rows);return rows;}
    catch(e){if(seq===ordersRef.current)setError(e.message);throw e;}
    finally{if(seq===ordersRef.current)setLoading(false);}
  },[]);
  const loadUnread=useCallback(async()=>{
    const seq=++unreadRef.current;
    try{const d=await api('/api/marketplace/orders/messages/unread');if(seq===unreadRef.current){setUnread(d);setUnreadError(false);}}
    catch(_){if(seq===unreadRef.current){setUnread(null);setUnreadError(true);}}
  },[]);
  const refresh=useCallback(()=>{loadOrders().catch(()=>{});loadUnread();},[loadOrders,loadUnread]);
  useEffect(()=>{
    refresh();
    const counters=[sessionRef,targetRef,ordersRef,unreadRef,readRef];
    const sync=()=>{if(!document.hidden)refresh();};
    window.addEventListener('focus',sync);
    const timer=window.setInterval(sync,45000);
    return()=>{window.removeEventListener('focus',sync);window.clearInterval(timer);for(const ref of counters)ref.current++;};
  },[refresh]);
  const readChat=useCallback(async(id,session)=>{
    const seq=++readRef.current;
    setChatLoading(true);setChatError('');
    try{const d=await api(`/api/marketplace/orders/${encodeURIComponent(id)}/messages`);if(session!==sessionRef.current||seq!==readRef.current)return;setMessages(Array.isArray(d.messages)?d.messages:[]);await loadUnread();}
    catch(e){if(session===sessionRef.current&&seq===readRef.current)setChatError(e.message);}
    finally{if(session===sessionRef.current&&seq===readRef.current)setChatLoading(false);}
  },[loadUnread]);
  const openChat=useCallback(order=>{
    const id=String(order._id),session=++sessionRef.current;
    setChatId(id);setMessages([]);setText('');setSending(false);sendRef.current=false;
    readChat(id,session);
  },[readChat]);
  useEffect(()=>{
    if(!requestTarget)return;
    const seq=++targetRef.current;
    sectionRef.current?.scrollIntoView?.({behavior:'smooth',block:'start'});
    loadOrders().then(rows=>{
      if(seq!==targetRef.current)return;
      const order=rows.find(o=>requestTarget.orderId?String(o._id)===String(requestTarget.orderId):o.viewerRole==='BUYER'&&['REQUESTED','ACCEPTED'].includes(o.status)&&String(o.listingId?._id||o.listingId)===String(requestTarget.listingId));
      if(order)openChat(order);else setError(t.missing);
    }).catch(()=>{});
  },[requestTarget,loadOrders,openChat,t.missing]);
  useEffect(()=>{if(chatId)chatRef.current?.scrollIntoView?.({behavior:'smooth',block:'start'});},[chatId]);
  function closeChat(){sessionRef.current++;sendRef.current=false;setChatId(null);setMessages([]);setChatError('');setSending(false);}
  async function send(e){
    e.preventDefault();if(!selected||!text.trim()||sendRef.current)return;
    const id=chatId,session=sessionRef.current;
    sendRef.current=true;setSending(true);setChatError('');
    try{await api(`/api/marketplace/orders/${encodeURIComponent(id)}/messages`,{method:'POST',body:JSON.stringify({body:text.trim()})});if(session!==sessionRef.current)return;setText('');await readChat(id,session);}
    catch(e){if(session===sessionRef.current)setChatError(e.message||t.sendError);}
    finally{if(session===sessionRef.current){sendRef.current=false;setSending(false);}}
  }
  async function update(order,status){
    if(busy||!window.confirm(t.confirm))return;setBusy(order._id);setError('');
    try{await api(`/api/marketplace/orders/${encodeURIComponent(order._id)}/status`,{method:'PATCH',body:JSON.stringify({status})});await loadOrders();}
    catch(e){setError(e.message);}
    finally{setBusy(null);}
  }
  const pending=orders.filter(o=>o.viewerRole==='SELLER'&&o.status==='REQUESTED').length;
  return <section ref={sectionRef} id="marketplace-orders" aria-label={t.title} style={{...box,borderColor:'#047857',margin:'22px 0'}}>
    <h2>{t.title}</h2>
    <div role="status" aria-live="polite">
      {pending>0&&<p><strong>{pending} {t.pending}</strong></p>}
      {unread?.totalUnread>0&&<p><strong>🔔 {unread.totalUnread} {t.unread}</strong></p>}
    </div>
    {unreadError&&<p role="alert">{t.unreadError}</p>}
    <button type="button" onClick={refresh} disabled={loading}>{loading?t.loading:t.refresh}</button>
    {error&&<p role="alert">{error||t.loadError}</p>}
    {[['SELLER',t.incoming],['BUYER',t.outgoing]].map(([role,title])=>{
      const rows=orders.filter(o=>o.viewerRole===role);
      return <section key={role} aria-label={title}>
        <h3>{title} ({rows.length})</h3>
        {!loading&&!rows.length&&<p>{t.empty}</p>}
        {rows.map(o=><article key={o._id} style={box}>
          <h4>{o.snapshot?.title||o.listingId?.title||String(o._id)}</h4>
          <p>{t.status}: <strong>{t[o.status]||o.status}</strong></p>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button type="button" onClick={()=>openChat(o)}>{t.messages}{Number(unread?.byOrder?.[o._id])>0?` (${unread.byOrder[o._id]} ${t.unread})`:''}</button>
            {role==='SELLER'&&o.status==='REQUESTED'&&<>
              <button type="button" disabled={Boolean(busy)} onClick={()=>update(o,'ACCEPTED')}>{t.accept}</button>
              <button type="button" disabled={Boolean(busy)} onClick={()=>update(o,'REJECTED')}>{t.reject}</button>
            </>}
            {['REQUESTED','ACCEPTED'].includes(o.status)&&<button type="button" disabled={Boolean(busy)} onClick={()=>update(o,'CANCELLED')}>{t.cancel}</button>}
          </div>
        </article>)}
      </section>;
    })}
    {selected&&<section ref={chatRef} aria-label={t.conversation} style={{...box,border:'2px solid #047857'}}>
      <h3>{t.conversation} — {selected.snapshot?.title||selected.listingId?.title}</h3>
      <button type="button" onClick={closeChat}>{t.close}</button>{' '}
      <button type="button" disabled={chatLoading} onClick={()=>readChat(chatId,sessionRef.current)}>{t.refresh}</button>
      <p>{t.status}: {t[selected.status]||selected.status}</p>
      {chatError&&<p role="alert">{chatError||t.chatError}</p>}
      <div aria-live="polite" style={{maxHeight:320,overflowY:'auto'}}>
        {chatLoading&&<p>{t.loading}</p>}
        {!chatLoading&&!chatError&&!messages.length&&<p>{t.noMessages}</p>}
        {messages.map(m=><article key={m._id} style={box}><p style={{whiteSpace:'pre-wrap'}}>{m.body}</p><small>{m.createdAt?new Date(m.createdAt).toLocaleString():''}</small></article>)}
      </div>
      {!['REJECTED','CANCELLED'].includes(selected.status)?<form onSubmit={send} style={{display:'grid',gap:8}}>
        <label htmlFor="marketplace-chat-text">{t.write}</label>
        <textarea id="marketplace-chat-text" rows={3} maxLength={2000} required value={text} onChange={e=>setText(e.target.value)} disabled={sending}/>
        <button type="submit" disabled={sending||!text.trim()}>{sending?t.sending:t.send}</button>
      </form>:<p>{t.closed}</p>}
    </section>}
  </section>;
}

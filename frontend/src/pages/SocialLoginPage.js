import React, { useEffect, useState } from 'react';

const RETURN_TO_KEY = 'myzubster-login-return-to';

function validReturnTo(value) {
  return value && value.startsWith('/') && !value.startsWith('//') ? value : '';
}

function safeReturnTo() {
  const fromQuery = validReturnTo(new URLSearchParams(window.location.search).get('returnTo'));
  if (fromQuery) { sessionStorage.setItem(RETURN_TO_KEY, fromQuery); return fromQuery; }
  return validReturnTo(sessionStorage.getItem(RETURN_TO_KEY)) || '/zorgax';
}

function finishReturnTo() {
  const destination = safeReturnTo();
  sessionStorage.removeItem(RETURN_TO_KEY);
  return destination;
}

function SocialLoginPage() {
  const [status, setStatus] = useState('Accedi con email e password MyZubster.');
  const [tone, setTone] = useState('#cbd5e1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState({ google:false, github:false, facebook:false });

  useEffect(() => { safeReturnTo(); let cancelled=false; fetch('/api/auth/social/providers').then(r=>r.json()).then(data=>{if(!cancelled&&data.success&&data.data?.providers)setProviders(data.data.providers)}).catch(()=>{}); return()=>{cancelled=true}; }, []);

  useEffect(() => {
    const params=new URLSearchParams(window.location.search), socialState=params.get('social_login'), ticket=params.get('social_login_ticket'), provider=params.get('provider');
    if(socialState==='error'){setTone('#fca5a5');setStatus(params.get('social_login_message')||'Login social non riuscito.');return undefined}
    if(socialState!=='verified'||!ticket)return undefined;
    let cancelled=false, redirectTimer; setLoading(true);setTone('#cbd5e1');setStatus('Verifica account social in corso…');
    (async()=>{try{const response=await fetch('/api/auth/social/exchange-ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ticket})});const data=await response.json();if(!response.ok||!data.success||!data.data?.token)throw new Error(data.message||'Ticket social non valido');if(cancelled)return;localStorage.setItem('myzubster-token',data.data.token);localStorage.setItem('myzubster-identity-provider',data.data.provider||provider||'social');if(data.data.characterId)localStorage.setItem('myzubster-metaverse-character-id',data.data.characterId);const destination=finishReturnTo();setTone('#86efac');setStatus('✓ Login social verificato. Continuo…');redirectTimer=setTimeout(()=>window.location.assign(destination),500)}catch(error){if(!cancelled){setTone('#fca5a5');setStatus(error.message||'Login social non riuscito.');setLoading(false)}}})();
    return()=>{cancelled=true;if(redirectTimer)clearTimeout(redirectTimer)};
  }, []);

  async function handlePasswordLogin(event){event.preventDefault();if(!email.trim()||!password){setTone('#fca5a5');setStatus('Inserisci email e password.');return}setLoading(true);setTone('#cbd5e1');setStatus('Accesso MyZubster in corso…');try{const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email.trim().toLowerCase(),password})});const data=await response.json();if(!response.ok||!data.success||!data.data?.token)throw new Error(data.message||'Login non riuscito');localStorage.setItem('myzubster-token',data.data.token);localStorage.setItem('myzubster-identity-provider','password');if(data.data.user)localStorage.setItem('myzubster-user',JSON.stringify(data.data.user));if(data.data.character?.characterId)localStorage.setItem('myzubster-metaverse-character-id',data.data.character.characterId);else localStorage.removeItem('myzubster-metaverse-character-id');const destination=finishReturnTo();setTone('#86efac');setStatus('✓ Login effettuato. Continuo…');setPassword('');setTimeout(()=>window.location.assign(destination),500)}catch(error){setTone('#fca5a5');setStatus(error.message||'Login non riuscito.')}finally{setLoading(false)}}

  const button={display:'block',width:'100%',textAlign:'center',color:'#fff',background:'#17263b',border:'1px solid #34465f',borderRadius:12,padding:'13px 16px',fontWeight:800};
  const input={width:'100%',boxSizing:'border-box',color:'#f8fafc',background:'#070b16',border:'1px solid #34465f',borderRadius:12,padding:'13px 14px',fontSize:15};
  const oauthHref=provider=>{safeReturnTo();return `/api/auth/social/${provider}/start`};

  return <main style={{minHeight:'100vh',background:'#070b16',color:'#f8fafc',display:'grid',placeItems:'center',padding:20}}><section style={{width:'min(92vw,540px)',background:'#0d1726',border:'1px solid #26364b',borderRadius:20,padding:28}}><div style={{fontSize:12,letterSpacing:1.4,color:'#67e8f9',fontWeight:900}}>MYZUBSTER · ZORGAX IDENTITY</div><h1 style={{marginBottom:10}}>Accedi a MyZubster</h1><p style={{color:'#aebdca',lineHeight:1.5}}>Inserisci le credenziali del tuo account MyZubster. I provider OAuth non configurati non vengono mostrati.</p><form onSubmit={handlePasswordLogin} style={{display:'grid',gap:10,margin:'22px 0'}}><input style={input} type="email" autoComplete="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} disabled={loading}/><input style={input} type="password" autoComplete="current-password" placeholder="Password MyZubster" value={password} onChange={e=>setPassword(e.target.value)} disabled={loading}/><button type="submit" disabled={loading} style={{...button,cursor:loading?'wait':'pointer'}}>{loading?'Accesso…':'Accedi con email e password'}</button></form>{(providers.google||providers.github||providers.facebook)&&<><div style={{textAlign:'center',color:'#7f91a6',margin:'4px 0 14px'}}>oppure</div><div style={{display:'grid',gap:10,marginBottom:18}}>{providers.google&&<a href={oauthHref('google')} style={button}>Continua con Google</a>}{providers.github&&<a href={oauthHref('github')} style={button}>Continua con GitHub</a>}{providers.facebook&&<a href={oauthHref('facebook')} style={button}>Continua con Facebook</a>}</div></>}<div style={{padding:12,borderRadius:10,background:'#0a1220',color:tone}}>{status}</div><p style={{fontSize:13,color:'#7f91a6',marginTop:18}}>La password viene inviata solo all'endpoint di autenticazione MyZubster e non viene salvata nel browser.</p><a href="/" style={{color:'#67e8f9'}}>← Torna a MyZubster</a></section></main>;
}

export default SocialLoginPage;

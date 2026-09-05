import React, { useState } from 'react';
import MapPage from './pages/MapPage';
import GardensPage from './pages/GardensPage';
import ClowbotBountiesPage from './pages/ClowbotBountiesPage';
import MetaversePage from './pages/MetaversePage';
import MarketplacePage from './pages/MarketplacePage';
import MarketplaceOpsPage from './pages/MarketplaceOpsPage';
import SocialLoginPage from './pages/SocialLoginPage';
import ZorgaxLifePilotPage from './pages/ZorgaxLifePilotPage';
import AppsDownloadPage from './pages/AppsDownloadPage';
import RobotPublicWalletPanel from './components/RobotPublicWalletPanel';
import { trackConversion } from './analytics/conversionAnalytics';

const TABS = { WORLD:'world', EXPLORE:'explore', GARDENS:'gardens', MISSIONS:'missions', MARKETPLACE:'marketplace', MARKETPLACE_OPS:'marketplace-ops' };
const lifeSpotlightStyle = { margin:'0 20px 20px', padding:'22px', borderRadius:'18px', border:'1px solid rgba(34, 197, 94, 0.35)', background:'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(168, 85, 247, 0.12))' };
const lifeActionsStyle = { display:'flex', flexWrap:'wrap', gap:'10px', marginTop:'14px' };
const lifeLinkStyle = { display:'inline-block', padding:'11px 15px', borderRadius:'10px', textDecoration:'none', fontWeight:900, color:'inherit', border:'1px solid currentColor' };
const marketplaceSpotlightStyle = { margin:'0 20px 20px', padding:'22px', borderRadius:'18px', border:'1px solid rgba(59, 130, 246, 0.38)', background:'linear-gradient(135deg, rgba(59, 130, 246, 0.14), rgba(168, 85, 247, 0.12))' };
function trackLifeCta(destination) { if (typeof window.va === 'function') window.va('event', { name:'Homepage LIFE CTA', data:{ destination } }); }
function LifeSpotlight() { return <section style={lifeSpotlightStyle} aria-labelledby="life-spotlight-title"><div style={{fontSize:13,fontWeight:900,letterSpacing:'.08em',opacity:.78}}>LIFE 2027 · PERCORSO PREPARATORIO</div><h2 id="life-spotlight-title" style={{margin:'6px 0 8px'}}>🌍 Dati → evidenze → KPI/MRV → impatto replicabile</h2><p style={{margin:0,lineHeight:1.55,maxWidth:900}}>MyZubster sta validando un percorso evidence-first per pilot ambientali, con focus su acqua, agricoltura, provenance dei dati e MRV digitale. Pilot, ruoli e partnership restano in fase di preparazione finché non vengono confermati esplicitamente.</p><div style={lifeActionsStyle}><a href="/life-pilot" onClick={()=>trackLifeCta('life-pilot')} style={{...lifeLinkStyle,background:'rgba(34, 197, 94, 0.14)'}}>Esplora LIFE Pilot →</a><a href="/press" onClick={()=>trackLifeCta('press')} style={lifeLinkStyle}>Press & Media →</a><a href="/come-funziona" onClick={()=>trackLifeCta('come-funziona')} style={lifeLinkStyle}>Come funziona MyZubster →</a></div></section>; }
function MarketplaceSpotlight() { return <section style={marketplaceSpotlightStyle} aria-labelledby="marketplace-spotlight-title"><div style={{fontSize:13,fontWeight:900,letterSpacing:'.08em',opacity:.78}}>MYZUBSTER MARKETPLACE</div><h2 id="marketplace-spotlight-title" style={{margin:'6px 0 8px'}}>🛒 Trasforma ciò che sai fare in valore</h2><p style={{margin:0,lineHeight:1.55,maxWidth:900}}>Esplora gratuitamente prodotti, servizi e proposte della comunità. Con MyZubster Seller puoi aprire il tuo spazio, pubblicare annunci e costruire reputazione attraverso gli scambi.</p><div style={lifeActionsStyle}><a href="/marketplace" onClick={()=>trackConversion('marketplace_cta_clicked',{source:'homepage_spotlight'})} style={{...lifeLinkStyle,background:'rgba(59, 130, 246, 0.16)'}}>Esplora il Marketplace →</a><a href="/marketplace" onClick={()=>trackConversion('seller_interest_clicked',{source:'homepage_spotlight'})} style={lifeLinkStyle}>Diventa Seller →</a></div></section>; }

function App() {
 const [activeTab,setActiveTab]=useState(TABS.WORLD); const path=window.location.pathname.replace(/\/+$/,'')||'/';
 if(path==='/social-login'||path==='/social-login.html') return <SocialLoginPage/>;
 if(path==='/life-pilot'||path==='/zorgax/life-pilot') return <ZorgaxLifePilotPage/>;
 if(path==='/apps') return <AppsDownloadPage/>;
 if(path==='/marketplace') return <MarketplacePage/>;
 if(path==='/metaverse') return <MetaversePage/>;
 return <div className="App"><nav style={{padding:'12px 20px',display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}} aria-label="MyZubster main navigation"><h1 style={{margin:0,fontSize:20}}>🌍 MyZubster</h1><a href="/social-login" onClick={()=>trackConversion('signup_started',{source:'homepage_nav'})} style={{fontWeight:900}}>🔐 Entra in MyZubster</a><a href="/marketplace" onClick={()=>trackConversion('marketplace_cta_clicked',{source:'homepage_nav'})} style={{fontWeight:900}}>🛒 Scopri il Marketplace</a><button onClick={()=>setActiveTab(TABS.WORLD)}>Entra</button><button onClick={()=>setActiveTab(TABS.EXPLORE)}>Esplora</button><button onClick={()=>setActiveTab(TABS.GARDENS)}>Il mio giardino</button><button onClick={()=>setActiveTab(TABS.MISSIONS)}>Missioni</button><button onClick={()=>{trackConversion('marketplace_cta_clicked',{source:'homepage_tab'});setActiveTab(TABS.MARKETPLACE);}}>Marketplace</button><button onClick={()=>setActiveTab(TABS.MARKETPLACE_OPS)}>I miei scambi</button><a href="/zorgax">Zorgax</a><a href="/life-pilot" style={{fontWeight:900}}>LIFE Pilot</a><a href="#robot-wallets" style={{fontWeight:900}}>Robot XMR/BTC</a><a href="/press" style={{fontWeight:900}}>Press</a><a href="/fumetto">Fumetto</a></nav><MarketplaceSpotlight/><LifeSpotlight/><RobotPublicWalletPanel/>{activeTab===TABS.WORLD&&<MetaversePage/>}{activeTab===TABS.EXPLORE&&<MapPage/>}{activeTab===TABS.GARDENS&&<GardensPage/>}{activeTab===TABS.MISSIONS&&<ClowbotBountiesPage/>}{activeTab===TABS.MARKETPLACE&&<MarketplacePage/>}{activeTab===TABS.MARKETPLACE_OPS&&<MarketplaceOpsPage/>}</div>;
}
export default App;

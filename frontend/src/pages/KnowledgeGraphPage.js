import React,{useEffect,useMemo,useState} from 'react';
import {knowledgeArticles} from '../data/knowledge';
import './KnowledgeGraphPage.css';

const color={article:'#ff4d8d',source:'#21d4b4',concept:'#8d7cff',person:'#f59e0b'};
const slug=v=>String(v||'').trim().toUpperCase().replace(/[^A-Z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,28)||'KNOWLEDGE';

export default function KnowledgeGraphPage(){
 const q=new URLSearchParams(window.location.search),domain=(q.get('domain')||'MONERO').toUpperCase(),id=(q.get('id')||'ART-001').toUpperCase();
 const staticArticle=knowledgeArticles[`${domain}:${id}`];
 const [publicCards,setPublicCards]=useState([]),[loadError,setLoadError]=useState('');
 useEffect(()=>{let live=true;fetch('/api/knowledge-evidence/public',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Catalogo non disponibile');return r.json()}).then(d=>{if(live)setPublicCards(Array.isArray(d.cards)?d.cards:[])}).catch(e=>{if(live)setLoadError(e.message)});return()=>{live=false}},[]);

 const dynamic=useMemo(()=>publicCards.map((c,i)=>({
   ...c,
   key:String(c._id||`public-${i}`),
   id:`K-${String(c._id||i).slice(-6).toUpperCase()}`,
   domain:String(c.domain||'GENERALE').toUpperCase(),
   publisher:c.publisherName||'Titolare MyZubster'
 })),[publicCards]);
 const requestedDynamic=dynamic.find(c=>c.domain===domain&&c.id===id);
 const article=staticArticle||requestedDynamic;
 const isDynamic=Boolean(requestedDynamic);

 const nodes=useMemo(()=>{
   if(isDynamic){
     const samePublisher=dynamic.filter(c=>c.publisher===requestedDynamic.publisher&&c.key!==requestedDynamic.key);
     const sources=(requestedDynamic.evidence||[]).filter(x=>x.url).map((x,i)=>({key:`s:${i}`,id:`SRC-${i+1}`,type:'source',title:x.label||'Fonte',description:x.note||x.url,url:x.url}));
     return [
       {key:`a:${id}`,id,type:'article',title:requestedDynamic.title,description:requestedDynamic.description},
       {key:`p:${slug(requestedDynamic.publisher)}`,id:slug(requestedDynamic.publisher),type:'person',title:requestedDynamic.publisher,description:'Profilo che ha pubblicato questa conoscenza'},
       ...samePublisher.map(c=>({key:`a:${c.id}`,id:c.id,type:'article',title:c.title,description:c.description,domain:c.domain})),
       ...sources,
       {key:`c:${slug(requestedDynamic.domain)}`,id:slug(requestedDynamic.domain),type:'concept',title:requestedDynamic.domain,description:'Ambito della conoscenza'}
     ];
   }
   return staticArticle?[{key:`a:${id}`,id,type:'article',title:staticArticle.title,description:staticArticle.summary},...staticArticle.relations.map(x=>{const a=knowledgeArticles[`${domain}:${x.id}`];return{key:`a:${x.id}`,id:x.id,type:'article',title:a?.title||x.label,description:a?.summary}}),...staticArticle.sources.map(x=>({key:`s:${x.id}`,id:x.id,type:'source',title:x.title,description:x.url,url:x.url})),...staticArticle.concepts.map(x=>({key:`c:${x.id}`,id:x.id,type:'concept',title:x.title,description:'Concetto collegato'}))]:[];
 },[staticArticle,isDynamic,requestedDynamic,dynamic,domain,id]);

 const [selected,setSelected]=useState(`a:${id}`),[filter,setFilter]=useState('all');
 useEffect(()=>setSelected(`a:${id}`),[id]);
 if(!article)return <main className="kg-shell"><div className="kg-error">{loadError?`Errore: ${loadError}`:`Conoscenza ${domain}/${id} non trovata.`}<br/><a href="/knowledge">Apri catalogo Conoscenze</a></div></main>;
 const shown=nodes.filter(n=>filter==='all'||n.type===filter||n.key===selected),active=nodes.find(n=>n.key===selected)||nodes[0],cx=390,cy=235;
 const pos=new Map(shown.map((n,i)=>n.key===`a:${id}`?[n.key,{x:cx,y:cy}]:[n.key,{x:cx+Math.cos((Math.PI*2*(i-1))/Math.max(shown.length-1,1)-Math.PI/2)*225,y:cy+Math.sin((Math.PI*2*(i-1))/Math.max(shown.length-1,1)-Math.PI/2)*155}]));
 const root=pos.get(`a:${id}`);
 const open=n=>{if(n.type==='article'){const d=n.domain||domain;window.location.assign(`/conoscenze?domain=${encodeURIComponent(d)}&id=${encodeURIComponent(n.id)}`)}};
 return <main className="kg-shell"><header><a href="/" className="kg-back">← MyZubster</a><p className="kg-eye">KNOWLEDGE GRAPH</p><h1>{domain} <span>↔</span> {id}</h1><p>{article.summary||article.description}</p>{isDynamic&&<p>Pubblicata da <strong>{requestedDynamic.publisher}</strong> · nodo generato automaticamente dal catalogo pubblico.</p>}</header><nav>{['all','article','person','source','concept'].map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{x==='all'?'Tutto':x}</button>)}</nav><section className="kg-work"><div className="kg-canvas"><svg viewBox="0 0 780 470" role="img" aria-label={`Grafo ${domain} ${id}`}>{root&&shown.filter(n=>n.key!==`a:${id}`).map(n=>{const p=pos.get(n.key);return <line key={n.key} x1={root.x} y1={root.y} x2={p.x} y2={p.y}/>})}{shown.map(n=>{const p=pos.get(n.key),sel=n.key===selected;return <g key={n.key} className="kg-node" transform={`translate(${p.x} ${p.y})`} tabIndex="0" onClick={()=>setSelected(n.key)} onDoubleClick={()=>open(n)}><circle r={n.key===`a:${id}`?52:41} fill={sel?color[n.type]:'#10182d'} stroke={color[n.type]} strokeWidth={sel?4:2}/><text y="-3">{n.id}</text><text className="type" y="17">{n.type}</text></g>})}</svg></div><aside><span className={`kg-badge ${active.type}`}>{active.type}</span><h2>{active.title}</h2><code>{active.id}</code><p>{active.description}</p>{active.type==='article'&&active.id!==id&&<button className="kg-open" onClick={()=>open(active)}>Apri conoscenza</button>}{active.url&&<a href={active.url} target="_blank" rel="noreferrer">Apri fonte ↗</a>}</aside></section><footer>{nodes.length} nodi · {Math.max(nodes.length-1,0)} relazioni{isDynamic?' · dati pubblici MyZubster':''}</footer></main>;
}

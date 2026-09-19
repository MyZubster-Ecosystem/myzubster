(() => {
  const LEVELS = {
    'self-declared': { label: 'Dichiarato', icon: '📝' },
    'externally-evidenced': { label: 'Evidenza esterna', icon: '🔗' },
    'cryptographically-proven': { label: 'Prova crittografica', icon: '🔐' },
    'project-demonstrated': { label: 'Dimostrato nel progetto', icon: '🧪' }
  };

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function safeUrl(value) {
    try {
      const u = new URL(value, location.origin);
      return ['http:', 'https:'].includes(u.protocol) ? u.href : '';
    } catch (_) { return ''; }
  }

  function evidenceLink(item) {
    const url = safeUrl(item.url);
    const label = esc(item.label || item.type || 'Evidenza');
    if (!url) return `<span class="k-evidence">• ${label} · ${esc(item.status || 'da verificare')}</span>`;
    return `<a class="k-evidence" href="${esc(url)}" target="_blank" rel="noopener noreferrer">↗ ${label}</a>`;
  }

  function card(claim) {
    const level = LEVELS[claim.evidenceLevel] || LEVELS['self-declared'];
    const evidence = (claim.evidence || []).map(evidenceLink).join('');\n    const key = esc(claim.evidenceLevel || 'self-declared');
    const transfers = (claim.transfers || []).map(t =>
      `<div class="k-transfer"><strong>↗ Knowledge transfer → ${esc(t.recipient)}</strong><span>${esc(t.status || 'documentato')}</span>${t.url && safeUrl(t.url) ? `<a href="${esc(safeUrl(t.url))}" target="_blank" rel="noopener noreferrer">Apri evidenza</a>` : ''}</div>`
    ).join('');
    return `<article class="knowledge-card" data-level="${esc(claim.evidenceLevel || 'self-declared')}">
      <div class="k-head"><div><small>KNOWLEDGE · ${esc(claim.domain || 'generale')}</small><h3>${esc(claim.title || claim.claim || 'Conoscenza')}</h3></div><span class="k-badge">${level.icon} ${level.label}</span></div>
      <p>${esc(claim.description || claim.claim || '')}</p>
      <button type="button" class="k-toggle" aria-expanded="false">Mostra evidenze</button><div class="k-details" hidden>${evidence ? `<div class="k-evidence-list"><strong>Evidenze</strong>${evidence}</div>` : '<div class="k-note">Nessuna evidenza pubblica collegata.</div>'}</div>
      ${claim.ownershipProof === 'unverified' ? '<div class="k-note">⚠️ Wallet storico: collegamento dichiarato, controllo dell’indirizzo non ancora provato.</div>' : ''}
      ${transfers}
    </article>`;
  }

  function styles() {
    if (document.getElementById('knowledgeCardStyles')) return;
    const s = document.createElement('style');
    s.id = 'knowledgeCardStyles';
    s.textContent = `.knowledge-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.knowledge-card{background:#090d1b;border:1px solid #334155;border-radius:16px;padding:16px}.k-head{display:flex;gap:12px;justify-content:space-between;align-items:flex-start}.k-head small{color:#94a3b8;text-transform:uppercase}.k-head h3{margin:5px 0 8px}.k-badge{white-space:nowrap;border:1px solid #475569;border-radius:999px;padding:6px 9px;font-size:12px}.k-evidence-list{display:flex;flex-direction:column;gap:7px;margin-top:12px}.k-evidence{color:#7dd3fc;text-decoration:none}.k-note{margin-top:12px;padding:9px;border-radius:10px;background:#111827;color:#cbd5e1;font-size:13px}.k-transfer{margin-top:12px;padding:10px;border-left:3px solid #8b5cf6;background:#15112b;display:flex;gap:8px;flex-direction:column}.k-transfer span{color:#c4b5fd;font-size:13px}.k-transfer a{color:#7dd3fc}.k-chain{margin-top:12px;padding:10px;border-left:3px solid #22c55e;background:#071b13;display:flex;gap:7px;flex-direction:column}.k-chain span{color:#bbf7d0;font-size:13px}.k-chain a{color:#7dd3fc}.k-toggle,.k-action{margin-top:12px;border:1px solid #475569;background:#172033;color:#e2e8f0;border-radius:10px;padding:9px 11px;cursor:pointer}.k-actions{display:flex;gap:8px;flex-wrap:wrap}.k-feedback{margin-top:8px;color:#a7f3d0;font-size:13px}.k-filter{display:flex;gap:8px;flex-wrap:wrap;margin:0 0 14px}.k-filter button{border:1px solid #475569;background:#111827;color:#e2e8f0;border-radius:999px;padding:8px 10px;cursor:pointer}.k-filter button[aria-pressed=\"true\"]{background:#334155}`;
    document.head.appendChild(s);
  }

  function render(target, claims) {
    styles();
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    el.classList.add('knowledge-grid');
    el.innerHTML = `<div class="k-filter" role="group" aria-label="Filtra conoscenze"><button type="button" data-filter="all" aria-pressed="true">Tutte</button>${Object.entries(LEVELS).map(([id,v])=>`<button type="button" data-filter="${id}" aria-pressed="false">${v.icon} ${v.label}</button>`).join('')}</div>` + (claims || []).map(card).join('');\n    el.querySelectorAll('.k-toggle').forEach(btn=>btn.addEventListener('click',()=>{const d=btn.nextElementSibling;const open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));btn.textContent=open?'Mostra evidenze':'Nascondi evidenze';d.hidden=open;}));\n    el.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{const filter=btn.dataset.filter;el.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',String(x===btn)));el.querySelectorAll('.knowledge-card').forEach(x=>x.hidden=filter!=='all'&&x.dataset.level!==filter);}));\n    el.querySelectorAll('.k-action').forEach(btn=>btn.addEventListener('click',()=>{const article=btn.closest('.knowledge-card');const feedback=article.querySelector('.k-feedback');if(btn.dataset.action==='verify'){feedback.textContent='Apri le evidenze e verifica ogni fonte. Per un wallet, usa una firma/challenge: mai seed o chiavi private.';article.querySelector('.k-details').hidden=false;article.querySelector('.k-toggle').setAttribute('aria-expanded','true');article.querySelector('.k-toggle').textContent='Nascondi evidenze';}else{const link=article.querySelector('.k-transfer a');if(link) link.click();else feedback.textContent='Il trasferimento richiede una evidenza o un artefatto collegato.';}}));
  }

  window.MyZubsterKnowledgeCards = { render, LEVELS };
})();
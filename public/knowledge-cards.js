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
    const evidence = (claim.evidence || []).map(evidenceLink).join('');
    const transfers = (claim.transfers || []).map(t =>
      `<div class="k-transfer"><strong>↗ Knowledge transfer → ${esc(t.recipient)}</strong><span>${esc(t.status || 'documentato')}</span>${t.url && safeUrl(t.url) ? `<a href="${esc(safeUrl(t.url))}" target="_blank" rel="noopener noreferrer">Apri evidenza</a>` : ''}</div>`
    ).join('');
    return `<article class="knowledge-card" data-level="${esc(claim.evidenceLevel || 'self-declared')}">
      <div class="k-head"><div><small>KNOWLEDGE · ${esc(claim.domain || 'generale')}</small><h3>${esc(claim.title || claim.claim || 'Conoscenza')}</h3></div><span class="k-badge">${level.icon} ${level.label}</span></div>
      <p>${esc(claim.description || claim.claim || '')}</p>
      ${evidence ? `<div class="k-evidence-list"><strong>Evidenze</strong>${evidence}</div>` : '<div class="k-note">Nessuna evidenza pubblica collegata.</div>'}
      ${claim.ownershipProof === 'unverified' ? '<div class="k-note">⚠️ Wallet storico: collegamento dichiarato, controllo dell’indirizzo non ancora provato.</div>' : ''}
      ${transfers}
    </article>`;
  }

  function styles() {
    if (document.getElementById('knowledgeCardStyles')) return;
    const s = document.createElement('style');
    s.id = 'knowledgeCardStyles';
    s.textContent = `.knowledge-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}.knowledge-card{background:#090d1b;border:1px solid #334155;border-radius:16px;padding:16px}.k-head{display:flex;gap:12px;justify-content:space-between;align-items:flex-start}.k-head small{color:#94a3b8;text-transform:uppercase}.k-head h3{margin:5px 0 8px}.k-badge{white-space:nowrap;border:1px solid #475569;border-radius:999px;padding:6px 9px;font-size:12px}.k-evidence-list{display:flex;flex-direction:column;gap:7px;margin-top:12px}.k-evidence{color:#7dd3fc;text-decoration:none}.k-note{margin-top:12px;padding:9px;border-radius:10px;background:#111827;color:#cbd5e1;font-size:13px}.k-transfer{margin-top:12px;padding:10px;border-left:3px solid #8b5cf6;background:#15112b;display:flex;gap:8px;flex-direction:column}.k-transfer span{color:#c4b5fd;font-size:13px}.k-transfer a{color:#7dd3fc}`;
    document.head.appendChild(s);
  }

  function render(target, claims) {
    styles();
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    el.classList.add('knowledge-grid');
    el.innerHTML = (claims || []).map(card).join('');
  }

  window.MyZubsterKnowledgeCards = { render, LEVELS };
})();
(() => {
  function token() {
    return localStorage.getItem('myzubster-token') || localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || '';
  }

  function normalizeZorgaxLabel(accessState) {
    const value = accessState.textContent || '';
    let next = value;
    if (value === 'Piano: Free') next = 'Zorgax: Free';
    else if (value.startsWith('Piano attivo: ')) next = `Zorgax: ${value.slice('Piano attivo: '.length)}`;
    if (next !== value) accessState.textContent = next;
  }

  function observeZorgaxLabel(accessState) {
    normalizeZorgaxLabel(accessState);
    const observer = new MutationObserver(() => normalizeZorgaxLabel(accessState));
    observer.observe(accessState, { childList:true, characterData:true, subtree:true });
  }

  async function refreshPaidState(accessState) {
    const t = token();
    if (!t) return;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        const response = await fetch('/api/zorgax/assistant/access', { headers:{ Authorization:`Bearer ${t}` } });
        const data = await response.json();
        if (response.ok && data.ok && data.access?.plan && data.access.plan !== 'free') {
          accessState.textContent = `Zorgax: ${data.access.plan}${data.access.expiresAt ? ` · fino al ${new Date(data.access.expiresAt).toLocaleDateString()}` : ''}`;
          return;
        }
      } catch (_error) {}
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    accessState.textContent = 'Pagamento ricevuto. Attivazione Zorgax in verifica; aggiorna tra pochi secondi.';
  }

  function ensureSellerState(accessState) {
    let sellerState = document.getElementById('sellerAccountState');
    if (sellerState) return sellerState;
    sellerState = document.createElement('span');
    sellerState.id = 'sellerAccountState';
    sellerState.className = 'paystate';
    sellerState.style.marginLeft = '4px';
    sellerState.style.whiteSpace = 'nowrap';
    sellerState.textContent = 'Marketplace: Seller non attivo';
    accessState.insertAdjacentElement('afterend', sellerState);
    return sellerState;
  }

  function updateSellerLinks(active) {
    document.querySelectorAll('[data-funnel-event="zorgax_to_seller"]').forEach(link => {
      link.textContent = active ? '💼 Seller attivo' : '💼 Diventa Seller';
      link.href = '/marketplace';
      if (active) link.setAttribute('aria-label', 'Apri il tuo Marketplace Seller attivo');
      else link.removeAttribute('aria-label');
    });
  }

  async function refreshSellerState(accessState) {
    const sellerState = ensureSellerState(accessState);
    const t = token();
    if (!t) {
      sellerState.textContent = 'Marketplace: accedi per verificare Seller';
      updateSellerLinks(false);
      return;
    }
    try {
      const response = await fetch('/api/marketplace/seller/me', { headers:{ Authorization:`Bearer ${t}` } });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Stato Seller non disponibile');
      const expiresAt = data.membership?.expiresAt;
      if (data.active) {
        sellerState.textContent = `Marketplace: Seller attivo${expiresAt ? ` · fino al ${new Date(expiresAt).toLocaleDateString()}` : ''}`;
        sellerState.style.color = '#86efac';
        updateSellerLinks(true);
      } else {
        sellerState.textContent = 'Marketplace: Seller non attivo';
        sellerState.style.color = '';
        updateSellerLinks(false);
      }
    } catch (_error) {
      sellerState.textContent = 'Marketplace: stato Seller non disponibile';
      sellerState.style.color = '';
      updateSellerLinks(false);
    }
  }

  function init() {
    const plan = document.getElementById('payPlan');
    const btcButton = document.getElementById('startBtc');
    const accessState = document.getElementById('accessState');
    if (!plan || !btcButton || !accessState || document.getElementById('startCard')) return;

    const notice = document.querySelector('.notice');
    if (notice) notice.textContent = 'Zorgax e Marketplace Seller sono abbonamenti separati. Zorgax può cercare sul web e preparare dati da inserire; gli upgrade Zorgax possono essere pagati con carta tramite Stripe oppure tramite rail crypto separati, mentre lo stato Seller viene mostrato separatamente.';

    observeZorgaxLabel(accessState);

    const cardButton = document.createElement('button');
    cardButton.id = 'startCard';
    cardButton.type = 'button';
    cardButton.textContent = '💳 Paga con carta';
    btcButton.insertAdjacentElement('afterend', cardButton);

    refreshSellerState(accessState);

    cardButton.addEventListener('click', async () => {
      const t = token();
      if (!t) {
        location.assign('/social-login?returnTo=' + encodeURIComponent('/zorgax'));
        return;
      }
      cardButton.disabled = true;
      const original = cardButton.textContent;
      cardButton.textContent = 'Apro Stripe…';
      try {
        const response = await fetch('/api/zorgax/stripe/checkout', {
          method:'POST',
          headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${t}` },
          body:JSON.stringify({ plan:plan.value })
        });
        const data = await response.json();
        if (!response.ok || !data.ok || !data.checkoutUrl) throw new Error(data.error || 'Checkout carta non disponibile');
        window.location.assign(data.checkoutUrl);
      } catch (error) {
        accessState.textContent = `Carta: ${error.message}`;
        cardButton.disabled = false;
        cardButton.textContent = original;
      }
    });

    const params = new URLSearchParams(location.search);
    if (params.get('zorgax') === 'success') {
      accessState.textContent = 'Pagamento Stripe completato. Verifico l’attivazione Zorgax…';
      refreshPaidState(accessState);
    } else if (params.get('zorgax') === 'cancelled') {
      accessState.textContent = 'Pagamento con carta annullato. Il piano Zorgax non è stato modificato.';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

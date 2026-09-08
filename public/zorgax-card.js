(() => {
  function token() {
    return localStorage.getItem('myzubster-token') || localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token') || '';
  }

  async function refreshPaidState(accessState) {
    const t = token();
    if (!t) return;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      try {
        const response = await fetch('/api/zorgax/assistant/access', { headers:{ Authorization:`Bearer ${t}` } });
        const data = await response.json();
        if (response.ok && data.ok && data.access?.plan && data.access.plan !== 'free') {
          accessState.textContent = `Piano attivo: ${data.access.plan}${data.access.expiresAt ? ` · fino al ${new Date(data.access.expiresAt).toLocaleDateString()}` : ''}`;
          return;
        }
      } catch (_error) {}
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    accessState.textContent = 'Pagamento ricevuto. Attivazione Zorgax in verifica; aggiorna tra pochi secondi.';
  }

  function init() {
    const plan = document.getElementById('payPlan');
    const btcButton = document.getElementById('startBtc');
    const accessState = document.getElementById('accessState');
    if (!plan || !btcButton || !accessState || document.getElementById('startCard')) return;

    const notice = document.querySelector('.notice');
    if (notice) notice.textContent = 'Zorgax può cercare sul web e preparare dati da inserire. Le scritture persistenti e gli upgrade richiedono login. Gli upgrade possono essere pagati con carta tramite Stripe oppure tramite rail crypto separati; l’accesso si attiva solo dopo verifica del pagamento.';

    const cardButton = document.createElement('button');
    cardButton.id = 'startCard';
    cardButton.type = 'button';
    cardButton.textContent = '💳 Paga con carta';
    btcButton.insertAdjacentElement('afterend', cardButton);

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
      accessState.textContent = 'Pagamento con carta annullato. Il piano non è stato modificato.';
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

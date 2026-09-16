(() => {
  const TRACK_ENDPOINT = '/api/zorgax/assistant/track';
  const form = document.getElementById('listingForm');
  if (!form || document.getElementById('zorgaxListingAssistant')) return;

  const $ = id => document.getElementById(id);
  const safeTrack = (event, target = '') => {
    fetch(TRACK_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({event, target: String(target || '').slice(0, 80)})
    }).catch(() => {});
  };

  const categoryHints = {
    services: ['Che servizio offri o cerchi?', 'Dove sei disponibile?', 'Indica tempi e condizioni.'],
    development_services: ['Che problema digitale risolvi?', 'Quali tecnologie o attività includi?', 'Indica disponibilità e area.'],
    event_support: ['Che attrezzatura o supporto offri?', 'Per quale tipo di evento?', 'Indica area, disponibilità e condizioni.'],
    pet_adoption: ['Descrivi l’animale e le esigenze di adozione.', 'Indica località pubblica e condizioni responsabili.', 'Non inserire dati privati nel testo.'],
    pet_lost_found: ['Descrivi animale, zona pubblica e quando è stato visto.', 'Aggiungi dettagli utili al riconoscimento.', 'Evita indirizzi privati.'],
    pet_services: ['Che servizio per animali offri?', 'Per quali animali?', 'Indica area e disponibilità.'],
    kefir_culture_donation: ['Che tipo di coltura doni?', 'Indica consegna e conservazione.', 'Nessuna promessa sanitaria o terapeutica.'],
    research_project: ['Qual è la domanda di ricerca?', 'Che collaborazione o risorsa cerchi?', 'Indica ente/area solo se pubblico.'],
    university_course: ['Che corso o formazione proponi?', 'A chi è rivolto?', 'Indica modalità, area e requisiti.'],
    help_request: ['Di che aiuto hai bisogno?', 'Dove?', 'Qual è il prossimo passo concreto?']
  };

  const style = document.createElement('style');
  style.textContent = `
    .zorgax-assist-btn{width:100%;background:#7c3aed!important;border:1px solid #a78bfa!important}
    .zorgax-assistant-backdrop{position:fixed;inset:0;z-index:9999;background:#020617cc;display:none;align-items:center;justify-content:center;padding:16px}
    .zorgax-assistant-backdrop.open{display:flex}
    .zorgax-assistant{width:min(620px,100%);max-height:88vh;overflow:auto;background:#0f1b27;border:1px solid #475569;border-radius:18px;padding:18px;box-shadow:0 24px 80px #0008}
    .zorgax-assistant h3{margin:0 0 6px;font-size:22px}.zorgax-assistant p{margin:4px 0 12px;color:#a9bac7}
    .zorgax-assistant .row{display:grid;gap:8px;margin:10px 0}.zorgax-assistant label{font-weight:800}.zorgax-assistant input,.zorgax-assistant textarea,.zorgax-assistant select{width:100%}
    .zorgax-assistant .actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}.zorgax-assistant .actions button{flex:1;min-width:130px}
    .zorgax-assistant .missing{color:#facc15;min-height:22px}.zorgax-assistant .privacy{font-size:12px;color:#94a3b8}
    @media(max-width:640px){.zorgax-assistant{max-height:94vh;border-radius:14px;padding:14px}.zorgax-assistant .actions{display:grid}.zorgax-assistant .actions button{width:100%}}
  `;
  document.head.appendChild(style);

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'zorgax-assist-btn';
  button.textContent = '✨ Compila con Zorgax';
  form.insertBefore(button, form.firstChild);

  const modal = document.createElement('div');
  modal.id = 'zorgaxListingAssistant';
  modal.className = 'zorgax-assistant-backdrop';
  modal.innerHTML = `
    <div class="zorgax-assistant" role="dialog" aria-modal="true" aria-labelledby="zorgaxAssistantTitle">
      <h3 id="zorgaxAssistantTitle">✨ Zorgax · Assistente annuncio</h3>
      <p>Rispondi a poche domande. Zorgax prepara una bozza nei campi del Marketplace; nulla viene pubblicato senza il tuo click su “Pubblica annuncio”.</p>
      <div class="row"><label for="zaCategory">Categoria</label><select id="zaCategory"></select></div>
      <div class="row"><label for="zaWhat">Cosa vuoi offrire, vendere, regalare o cercare?</label><input id="zaWhat" maxlength="120" placeholder="Es. noleggio sound system per eventi"></div>
      <div class="row"><label for="zaDetails">Dettagli utili</label><textarea id="zaDetails" maxlength="700" placeholder="Condizioni, quantità, disponibilità, requisiti…"></textarea></div>
      <div class="row"><label for="zaLocation">Località pubblica / area</label><input id="zaLocation" maxlength="100" placeholder="Es. Bologna e provincia"></div>
      <div class="row"><label for="zaExchange">Modalità</label><select id="zaExchange"><option value="BARTER">Baratto</option><option value="FREE">Gratis / regalo</option><option value="MYZ">MYZ</option><option value="XMR">XMR</option><option value="TARI">Tari</option></select></div>
      <div class="row" id="zaPriceRow"><label for="zaPrice">Prezzo</label><input id="zaPrice" type="number" min="0" step="any" placeholder="0"></div>
      <div id="zaHints" class="privacy"></div>
      <div id="zaMissing" class="missing"></div>
      <div class="privacy">Privacy: il tracking registra solo gli step del funnel, non il testo libero inserito qui.</div>
      <div class="actions"><button type="button" id="zaApply">Precompila annuncio</button><button type="button" class="alt" id="zaClose">Chiudi</button></div>
    </div>`;
  document.body.appendChild(modal);

  const category = $('category');
  const zaCategory = $('zaCategory');
  [...category.options].forEach(option => zaCategory.appendChild(option.cloneNode(true)));

  const refreshHints = () => {
    const hints = categoryHints[zaCategory.value] || ['Descrivi chiaramente cosa proponi o cerchi.', 'Indica area e condizioni.', 'Evita dati privati o sensibili.'];
    $('zaHints').innerHTML = '<strong>Zorgax suggerisce:</strong><br>' + hints.map(x => '• ' + x).join('<br>');
    const paid = !['FREE', 'BARTER'].includes($('zaExchange').value);
    $('zaPriceRow').style.display = paid ? 'grid' : 'none';
  };

  const open = () => {
    zaCategory.value = category.value;
    $('zaLocation').value = $('location').value || '';
    $('zaExchange').value = $('currency').value || 'BARTER';
    $('zaPrice').value = $('price').value || '';
    $('zaWhat').value = $('title').value || '';
    $('zaDetails').value = $('description').value || '';
    $('zaMissing').textContent = '';
    refreshHints();
    modal.classList.add('open');
    safeTrack('marketplace_listing_assistant_open', zaCategory.value);
    setTimeout(() => $('zaWhat').focus(), 0);
  };
  const close = () => modal.classList.remove('open');

  button.addEventListener('click', open);
  $('zaClose').addEventListener('click', close);
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('open')) close(); });
  zaCategory.addEventListener('change', refreshHints);
  $('zaExchange').addEventListener('change', refreshHints);

  $('zaApply').addEventListener('click', () => {
    const what = $('zaWhat').value.trim();
    const details = $('zaDetails').value.trim();
    const area = $('zaLocation').value.trim();
    const exchange = $('zaExchange').value;
    const paid = !['FREE', 'BARTER'].includes(exchange);
    const missing = [];
    if (!what) missing.push('cosa vuoi pubblicare');
    if (!details) missing.push('dettagli');
    if (!area) missing.push('località/area');
    if (paid && !$('zaPrice').value) missing.push('prezzo');
    if (missing.length) {
      $('zaMissing').textContent = 'Manca: ' + missing.join(', ') + '.';
      return;
    }

    category.value = zaCategory.value;
    category.dispatchEvent(new Event('change', {bubbles: true}));
    $('title').value = what;
    $('description').value = details;
    $('location').value = area;
    $('currency').value = exchange;
    $('currency').dispatchEvent(new Event('change', {bubbles: true}));
    if (paid) $('price').value = $('zaPrice').value;

    safeTrack('marketplace_listing_assistant_fields_completed', zaCategory.value);
    $('listingStatus').textContent = 'Bozza preparata da Zorgax. Controlla i campi e premi “Pubblica annuncio” solo quando sei pronto.';
    close();
    form.scrollIntoView({behavior: 'smooth', block: 'start'});
  });

  form.addEventListener('submit', () => safeTrack('marketplace_listing_submit', category.value));
})();

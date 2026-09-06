'use strict';

const TelegramBot = require('node-telegram-bot-api');

const DEFAULT_RULES = [
  'Rispetto reciproco, niente molestie o discriminazione.',
  'Condividere solo eventi e spazi autorizzati dagli organizzatori.',
  'Niente istruzioni per accessi abusivi, elusione di permessi o controlli.',
  'Tutela della privacy: non pubblicare dati personali senza consenso.',
  'Welfare e riduzione dei rischi vengono prima della promozione.'
];

class FlytekCommunityBot {
  constructor({ token, logger = console, communityName = 'Flytek', eventProvider = null } = {}) {
    this.token = token;
    this.logger = logger;
    this.communityName = communityName;
    this.eventProvider = eventProvider;
    this.bot = null;
    this.running = false;
  }

  async start() {
    if (!this.token || this.token === 'your_telegram_bot_token') {
      this.logger.warn('Flytek Telegram token not configured. Running in mock mode.');
      this.running = true;
      return;
    }

    this.bot = new TelegramBot(this.token, { polling: true });
    this.bot.onText(/^\/start(?:@\w+)?$/, msg => this.handleStart(msg));
    this.bot.onText(/^\/help(?:@\w+)?$/, msg => this.handleHelp(msg));
    this.bot.onText(/^\/rules(?:@\w+)?$/, msg => this.handleRules(msg));
    this.bot.onText(/^\/events(?:@\w+)?$/, msg => this.handleEvents(msg));
    this.bot.onText(/^\/lineup(?:@\w+)?$/, msg => this.handleLineup(msg));
    this.bot.onText(/^\/crew(?:@\w+)?$/, msg => this.handleCrew(msg));
    this.bot.onText(/^\/welfare(?:@\w+)?$/, msg => this.handleWelfare(msg));
    this.bot.onText(/^\/organize(?:@\w+)?$/, msg => this.handleOrganize(msg));
    this.running = true;
    this.logger.info(`${this.communityName} community bot is ready`);
  }

  async stop() {
    if (this.bot) await this.bot.stopPolling();
    this.running = false;
  }

  async send(chatId, text, options = {}) {
    if (this.bot) return this.bot.sendMessage(chatId, text, options);
    this.logger.info(`[MOCK ${this.communityName}] ${chatId}: ${text}`);
  }

  async handleStart(msg) {
    return this.send(msg.chat.id, `🔊 ${this.communityName} Community Bot\n\nUno strumento per la community raver e DIY: eventi autorizzati, lineup, crew, welfare e cultura indipendente.\n\nComandi: /events /lineup /crew /welfare /organize /rules /help`);
  }

  async handleHelp(msg) {
    return this.send(msg.chat.id, [
      `🤖 ${this.communityName} bot`,
      '/events — eventi pubblicati dagli organizzatori',
      '/lineup — lineup e timetable disponibili',
      '/crew — ruoli e contributi della community',
      '/welfare — acqua, riposo, accessibilità e sicurezza',
      '/organize — checklist per costruire un party autorizzato',
      '/rules — regole della community'
    ].join('\n'));
  }

  async handleRules(msg) {
    return this.send(msg.chat.id, `📜 Regole ${this.communityName}\n\n${DEFAULT_RULES.map(rule => `• ${rule}`).join('\n')}`);
  }

  async getEventData() {
    if (typeof this.eventProvider !== 'function') return null;
    try {
      return await this.eventProvider();
    } catch (error) {
      this.logger.error('Flytek event provider failed:', error);
      return null;
    }
  }

  async handleEvents(msg) {
    const data = await this.getEventData();
    if (!data?.events?.length) return this.send(msg.chat.id, '📅 Nessun evento pubblico confermato al momento. Gli organizzatori possono collegare una sorgente eventi verificata.');
    const rows = data.events.slice(0, 8).map(event => `• ${event.title}${event.date ? ` — ${event.date}` : ''}${event.publicUrl ? `\n  ${event.publicUrl}` : ''}`);
    return this.send(msg.chat.id, `📅 Eventi ${this.communityName}\n\n${rows.join('\n')}`);
  }

  async handleLineup(msg) {
    const data = await this.getEventData();
    if (!data?.lineup?.length) return this.send(msg.chat.id, '🎛️ Nessuna lineup pubblica confermata. La timetable va pubblicata solo dopo conferma degli artisti/organizzatori.');
    return this.send(msg.chat.id, `🎛️ Lineup\n\n${data.lineup.slice(0, 20).map(row => `• ${row}`).join('\n')}`);
  }

  async handleCrew(msg) {
    return this.send(msg.chat.id, '🧰 Crew\n\nRuoli utili: sound, luci, artist liaison, comunicazione, bar/hospitality, welfare, accessibilità, pulizia/raccolta differenziata, foto/video con consenso, archivio culturale. Le responsabilità restano agli organizzatori umani.');
  }

  async handleWelfare(msg) {
    return this.send(msg.chat.id, '💚 Welfare\n\nPrevedi acqua potabile, area riposo, accessibilità, contatti di emergenza, gestione del rumore, rifiuti, informazioni chiare e persone riconoscibili a cui chiedere aiuto. Il bot non sostituisce professionisti, autorità o piani di sicurezza richiesti dalla legge.');
  }

  async handleOrganize(msg) {
    return this.send(msg.chat.id, [
      '🗂️ Checklist party autorizzato',
      '',
      '1. Definisci concept, data e organizzatori responsabili.',
      '2. Verifica disponibilità e autorizzazione dello spazio.',
      '3. Controlla permessi, capienza, rumore, sicurezza e requisiti locali.',
      '4. Conferma sound system, artisti e timetable.',
      '5. Assegna crew: tecnico, welfare, hospitality, comunicazione, pulizia.',
      '6. Pubblica solo informazioni approvate dagli organizzatori.',
      '7. Prepara welfare, accessibilità, acqua, rifiuti e piano di emergenza.',
      '8. Dopo l’evento archivia flyer, lineup e contributi con consenso.',
      '',
      'Il bot non aiuta a bypassare permessi, controlli o accessi non autorizzati.'
    ].join('\n'));
  }
}

module.exports = FlytekCommunityBot;
module.exports.DEFAULT_RULES = DEFAULT_RULES;

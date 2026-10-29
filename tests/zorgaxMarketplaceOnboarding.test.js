'use strict';

const fs = require('fs');
const path = require('path');
const {
  marketplaceIntent,
  sellerIntent,
  contributorIntent,
  buildMarketplaceContext,
  buildRuntimeProductContext,
  buildAssistantPrompt,
  answer
} = require('../src/services/zorgaxAssistantService');

describe('Zorgax Marketplace & Seller Onboarding Contract (#1674)', () => {
  describe('1. Intent classification and separation', () => {
    test('identifies selling and marketplace intent in Italian', () => {
      expect(marketplaceIntent('vorrei vendere sul marketplace è possibile?')).toBe(true);
      expect(marketplaceIntent('voglio comprare un servizio')).toBe(true);
      expect(marketplaceIntent('come pubblico un annuncio?')).toBe(true);
      expect(marketplaceIntent('richiedi un servizio nel marketplace')).toBe(true);
      expect(marketplaceIntent('quanto costa vendere sul marketplace?')).toBe(true);
      expect(marketplaceIntent('quali prodotti ci sono nella vetrina?')).toBe(true);

      // Non-marketplace queries
      expect(marketplaceIntent('qual è la ricetta del kefir?')).toBe(false);
      expect(marketplaceIntent('come funziona la sintesi proteica?')).toBe(false);
    });

    test('distinguishes seller intent from pure buyer intent', () => {
      expect(sellerIntent('vorrei vendere sul marketplace è possibile?')).toBe(true);
      expect(sellerIntent('voglio diventare seller e offrire le mie competenze')).toBe(true);
      expect(sellerIntent('come pubblico un annuncio?')).toBe(true);

      expect(sellerIntent('voglio solo comprare prodotti')).toBe(false);
      expect(sellerIntent('cerco un cane smarrito')).toBe(false);
    });

    test('distinguishes developer contributor intent from marketplace seller/buyer', () => {
      expect(contributorIntent('voglio contribuire al codice open source su GitHub')).toBe(true);
      expect(contributorIntent('come faccio una pull request sul repository?')).toBe(true);
      expect(contributorIntent('vorrei clonare il repo e fare sviluppo')).toBe(true);

      // Marketplace questions must NOT be classified as contributor intent
      expect(contributorIntent('vorrei vendere sul marketplace è possibile?')).toBe(false);
      expect(contributorIntent('perché? a cosa serve per vendere nel marketplace?')).toBe(false);
      expect(contributorIntent('come pubblico il mio primo annuncio')).toBe(false);
      expect(contributorIntent('voglio comprare servizi')).toBe(false);
    });
  });

  describe('2. Runtime context and prompt instructions contract', () => {
    test('buildRuntimeProductContext contains SELLER_FREE and disclaims GitHub/OS requirements', () => {
      const runtime = buildRuntimeProductContext();

      expect(runtime).toContain('LIVE ROUTE: /marketplace');
      expect(runtime).toContain('SELLER_FREE');
      expect(runtime).toContain('0 EUR');
      expect(runtime).toContain('5 active commercial listings');
      expect(runtime).toContain('2% platform commission');
      expect(runtime).toContain('NO GitHub account is required to buy, sell, or publish listings on Marketplace');
      expect(runtime).toContain('NO Operating System (OS) setup or developer environment is required');
      expect(runtime).toContain('NEVER ask Marketplace visitors or sellers for GitHub or OS');
      expect(runtime).toContain('/social-login');
    });

    test('buildMarketplaceContext injects specialist guidance when marketplace intent is present', () => {
      const context = buildMarketplaceContext('vorrei vendere sul marketplace è possibile?');

      expect(context).toContain('ACTIVE SPECIALIST MODE: MARKETPLACE & SELLER ONBOARDING');
      expect(context).toContain('DO NOT ask for a GitHub account or GitHub username');
      expect(context).toContain('DO NOT ask for their Operating System');
      expect(context).toContain('SELLER_FREE');
      expect(context).toContain('0 EUR cost');
      expect(context).toContain('up to 5 active commercial listings');
      expect(context).toContain('2%');
      expect(context).toContain('/marketplace');
      expect(context).toContain('/social-login');
    });

    test('buildMarketplaceContext does not activate when user explicitly asks for code contribution', () => {
      const context = buildMarketplaceContext('voglio contribuire al codice su GitHub e aprire una pull request');
      expect(context).toBe('');
    });

    test('buildAssistantPrompt includes marketplace specialist context without requesting GitHub or OS', () => {
      const prompt = buildAssistantPrompt('vorrei vendere sul marketplace è possibile?');

      expect(prompt).toContain('ACTIVE SPECIALIST MODE: MARKETPLACE & SELLER ONBOARDING');
      expect(prompt).toContain('DO NOT ask for a GitHub account or GitHub username');
      expect(prompt).toContain('DO NOT ask for their Operating System');
      expect(prompt).toContain('/marketplace');
      expect(prompt).toContain('SELLER_FREE');
    });

    test('SYSTEM_PROMPT.md explicitly separates Marketplace onboarding from Developer onboarding', () => {
      const systemPrompt = fs.readFileSync(
        path.join(__dirname, '../agents/zorgax/SYSTEM_PROMPT.md'),
        'utf8'
      );

      expect(systemPrompt).toContain('## Marketplace vs Developer onboarding (CRITICAL RULE)');
      expect(systemPrompt).toContain('SELLER_FREE');
      expect(systemPrompt).toContain('0 EUR to start');
      expect(systemPrompt).toContain('5 active commercial listings');
      expect(systemPrompt).toContain('2% platform commission');
      expect(systemPrompt).toContain('NEVER ask for a GitHub account or Operating System');
      expect(systemPrompt).toContain('/marketplace');
      expect(systemPrompt).toContain('/social-login');
      expect(systemPrompt).toContain('Reserve GitHub, repository cloning, pull requests, and operating system questions STRICTLY for users who explicitly ask to contribute code');
    });
  });

  describe('3. Multi-turn Italian conversational flow verification', () => {
    const originalFetch = global.fetch;
    afterEach(() => {
      global.fetch = originalFetch;
    });

    test('Multi-turn Seller onboarding: Turn 1 (Intent to sell) -> Turn 2 (Clarification) -> Turn 3 (Publishing)', async () => {
      // Turn 1: Utente chiede «vorrei vendere sul marketplace è possibile?»
      const turn1Message = 'vorrei vendere sul marketplace è possibile?';
      const promptTurn1 = buildAssistantPrompt(turn1Message, []);

      // Verify that Turn 1 prompt strictly prevents asking for GitHub or OS
      expect(promptTurn1).toContain('ACTIVE SPECIALIST MODE: MARKETPLACE & SELLER ONBOARDING');
      expect(promptTurn1).toContain('DO NOT ask for a GitHub account or GitHub username');
      expect(promptTurn1).toContain('DO NOT ask for their Operating System');
      expect(promptTurn1).toContain('SELLER_FREE');

      // Turn 2: Utente chiede «perché?» o «a cosa serve per vendere nel marketplace»
      const turn2Message = 'perché? a cosa serve per vendere nel marketplace?';
      const promptTurn2 = buildAssistantPrompt(turn2Message, []);

      expect(promptTurn2).toContain('ACTIVE SPECIALIST MODE: MARKETPLACE & SELLER ONBOARDING');
      expect(promptTurn2).toContain('DO NOT ask for a GitHub account or GitHub username');
      expect(promptTurn2).toContain('DO NOT ask for their Operating System');
      expect(promptTurn2).toContain('explicitly clarify that only a web browser and free account are needed—no developer tools, GitHub, or OS configuration required');

      // Turn 3: Utente chiede «come pubblico il mio primo annuncio?»
      const turn3Message = 'come pubblico il mio primo annuncio sul marketplace?';
      const promptTurn3 = buildAssistantPrompt(turn3Message, []);

      expect(promptTurn3).toContain('ACTIVE SPECIALIST MODE: MARKETPLACE & SELLER ONBOARDING');
      expect(promptTurn3).toContain('/marketplace');
      expect(promptTurn3).toContain('SELLER_FREE');
    });

    test('answer() flags specialist_mode as marketplace-onboarding for marketplace queries', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({
          ok: true,
          response: 'Certamente! Vendere su MyZubster è possibile e gratuito: puoi attivare il profilo SELLER_FREE su /marketplace e pubblicare fino a 5 annunci senza costi iniziali.'
        })
      }));

      const result = await answer({
        message: 'vorrei vendere sul marketplace è possibile?',
        useWeb: false
      });

      expect(result.specialist_mode).toBe('marketplace-onboarding');
      expect(result.response).toContain('Vendere su MyZubster è possibile');
      expect(result.response).toContain('/marketplace');
      expect(result.response).not.toContain('sistema operativo');
      expect(result.response).not.toContain('GitHub obbligatorio');
    });

    test('answer() preserves kefir specialist_mode for kefir queries', async () => {
      global.fetch = jest.fn(async () => ({
        ok: true,
        status: 200,
        headers: { get: () => null },
        json: async () => ({
          ok: true,
          response: 'I grani di kefir d’acqua richiedono acqua declorata e zucchero grezzo.'
        })
      }));

      const result = await answer({
        message: 'come curo i miei grani di kefir di latte?',
        useWeb: false
      });

      expect(result.specialist_mode).toBe('kefir-circular-food');
    });

    test('Developer contributor workflow is preserved without marketplace pollution', () => {
      const devPrompt = buildAssistantPrompt(
        'Voglio contribuire al codice open source su GitHub e aprire una pull request',
        []
      );

      // Must NOT activate marketplace specialist mode
      expect(devPrompt).not.toContain('ACTIVE SPECIALIST MODE: MARKETPLACE & SELLER ONBOARDING');
      // Must preserve canonical open-source contribution context
      expect(devPrompt).toContain('Open-source contribution through the public MyZubster code/documentation workflow is a real contribution path');
    });
  });
});

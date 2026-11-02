'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  loadMyZubsterGuide,
  matchCanonicalQuestion,
  CANONICAL_TOPICS
} = require('../src/services/zorgaxKnowledgeBase');
const {
  answer,
  buildAssistantPrompt,
  buildDegradedFallback
} = require('../src/services/zorgaxAssistantService');
const app = require('../server');

let mongo;
const originalFetch = global.fetch;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

afterEach(() => {
  global.fetch = originalFetch;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ZORGAX_PUBLIC_AI_URL;
});

describe('Zorgax Knowledge Base & Non-Technical Pathway Guide (Issue #1677)', () => {
  describe('1. Versioned Knowledge Base Document (MYZUBSTER_GUIDE.md)', () => {
    test('loads canonical guide containing real routes and honest capability boundaries', () => {
      const guide = loadMyZubsterGuide();
      expect(typeof guide).toBe('string');
      expect(guide.length).toBeGreaterThan(500);

      // Verified live routes
      expect(guide).toContain('/marketplace');
      expect(guide).toContain('/metaverse');
      expect(guide).toContain('/life-pilot');
      expect(guide).toContain('/social-login');
      expect(guide).toContain('https://github.com/MyZubster-Ecosystem/myzubster');

      // Capability status transparency
      expect(guide).toContain('LIVE');
      expect(guide).toContain('PILOT');
      expect(guide).toContain('NON ABILITATO');
      expect(guide).toContain('NESSUNA PROMESSA');
    });

    test('injects knowledge guide into the shared assistant prompt', () => {
      const prompt = buildAssistantPrompt('Come funziona MyZubster?');
      expect(prompt).toContain('MyZubster Knowledge Base & Guida ai Percorsi');
      expect(prompt).toContain('/marketplace');
      expect(prompt).toContain('/social-login');
      expect(prompt).toContain('USER MESSAGE:');
    });
  });

  describe('2. Canonical Question 1: «cos\'è MyZubster?»', () => {
    test('matches canonical question and explains the open-source collaborative ecosystem', () => {
      const match = matchCanonicalQuestion('Che cos\'è MyZubster?');
      expect(match).toBeDefined();
      expect(match.topic).toBe('WHAT_IS_MYZUBSTER');
      expect(match.answer).toContain('ecosistema digitale open-source e collaborativo');
      expect(match.answer).toContain('/marketplace');
      expect(match.answer).toContain('/metaverse');
      expect(match.answer).toContain('/life-pilot');
      expect(match.answer).toContain('anteprima attiva (MVP)');
      expect(match.answer).not.toMatch(/investimento|guadagno garantito|criptovaluta quotata/i);
    });

    test('handles English variation: "what is myzubster"', () => {
      const match = matchCanonicalQuestion('What is MyZubster?');
      expect(match).toBeDefined();
      expect(match.topic).toBe('WHAT_IS_MYZUBSTER');
    });
  });

  describe('3. Canonical Question 2: «posso vendere?»', () => {
    test('explains free Seller activation, listing creation, and direct peer agreements', () => {
      const match = matchCanonicalQuestion('Posso vendere su MyZubster?');
      expect(match).toBeDefined();
      expect(match.topic).toBe('CAN_I_SELL');
      expect(match.answer).toContain('Sì, chiunque può attivare gratuitamente il proprio spazio Seller');
      expect(match.answer).toContain('/marketplace');
      expect(match.answer).toContain('Diventa Seller · Gratis');
      expect(match.answer).toContain('/social-login');
      expect(match.answer).toContain('Pubblica annuncio');
      expect(match.answer).toContain('Non sono attivi checkout o escrow automatici');
    });

    test('handles phrasing variation: "come diventare venditore"', () => {
      const match = matchCanonicalQuestion('Come diventare venditore?');
      expect(match).toBeDefined();
      expect(match.topic).toBe('CAN_I_SELL');
    });
  });

  describe('4. Canonical Question 3: «come contatto un venditore?»', () => {
    test('explains the request modal, "Le mie richieste", and private order chat', () => {
      const match = matchCanonicalQuestion('Come contatto un venditore?');
      expect(match).toBeDefined();
      expect(match.topic).toBe('HOW_TO_CONTACT_SELLER');
      expect(match.answer).toContain('Richiedi');
      expect(match.answer).toContain('/social-login');
      expect(match.answer).toContain('Le mie richieste');
      expect(match.answer).toContain('chat privata');
      expect(match.answer).toContain('🔔');
    });

    test('handles phrasing variation: "come richiedo un annuncio"', () => {
      const match = matchCanonicalQuestion('Come richiedo un annuncio?');
      expect(match).toBeDefined();
      expect(match.topic).toBe('HOW_TO_CONTACT_SELLER');
    });
  });

  describe('5. Canonical Question 4: «cos\'è il Metaverso?»', () => {
    test('explains browser-based 3D virtual rooms and distinguishes from unverified sales', () => {
      const match = matchCanonicalQuestion('Cos\'è il Metaverso?');
      expect(match).toBeDefined();
      expect(match.topic).toBe('WHAT_IS_METAVERSE');
      expect(match.answer).toContain('spazio virtuale 3D');
      expect(match.answer).toContain('/metaverse');
      expect(match.answer).toContain('senza necessità di visori VR');
      expect(match.answer).toContain('stand commerciali automatizzati');
      expect(match.answer).toContain('non attivi per transazioni commerciali in produzione');
    });
  });

  describe('6. Canonical Question 5: «come contribuisco su GitHub?»', () => {
    test('provides open-source contributor workflow and separates technical path from non-technical users', () => {
      const match = matchCanonicalQuestion('Come contribuisco su GitHub?');
      expect(match).toBeDefined();
      expect(match.topic).toBe('HOW_TO_CONTRIBUTE_GITHUB');
      expect(match.answer).toContain('https://github.com/MyZubster-Ecosystem/myzubster');
      expect(match.answer).toContain('Fork & Branch');
      expect(match.answer).toContain('npm test');
      expect(match.answer).toContain('Pull Request');
      expect(match.answer).toContain('separato dall\'esperienza d\'uso per cittadini e venditori');
    });

    test('handles phrasing variation: "come faccio una PR"', () => {
      const match = matchCanonicalQuestion('Come faccio una PR?');
      expect(match).toBeDefined();
      expect(match.topic).toBe('HOW_TO_CONTRIBUTE_GITHUB');
    });
  });

  describe('7. Fallback & Degradation Resilience', () => {
    test('buildDegradedFallback serves canonical guide when matching canonical questions', () => {
      const fallback = buildDegradedFallback('Posso vendere?');
      expect(fallback).toContain('Sì, chiunque può attivare gratuitamente il proprio spazio Seller');
      expect(fallback).toContain('/marketplace');
    });

    test('answer() serves canonical knowledge base directly when remote models are unconfigured', async () => {
      const res = await answer({ message: 'Cos\'è MyZubster?', useWeb: false });
      expect(res.status).toBe('canonical_knowledge_success');
      expect(res.ai_generation_succeeded).toBe(true);
      expect(res.execution_type).toBe('knowledge_base');
      expect(res.response).toContain('ecosistema digitale open-source e collaborativo');
      expect(res.response).toContain('/marketplace');
      expect(res.response).toContain('/metaverse');
    });
  });

  describe('8. End-to-End HTTP Route Verification (/api/zorgax/assistant/chat)', () => {
    const canonicalQuestions = [
      'Cos\'è MyZubster?',
      'Posso vendere?',
      'Come contatto un venditore?',
      'Cos\'è il Metaverso?',
      'Come contribuisco su GitHub?'
    ];

    for (const q of canonicalQuestions) {
      test(`POST /api/zorgax/assistant/chat answers accurately to: "${q}"`, async () => {
        const res = await request(app)
          .post('/api/zorgax/assistant/chat')
          .send({ message: q, useWeb: false });

        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        expect(typeof res.body.response).toBe('string');
        expect(res.body.response.length).toBeGreaterThan(50);
        expect(res.body.answer).toBe(res.body.response);
        expect(res.body.message).toBe(res.body.response);
        expect(res.body.ai_generation_succeeded).toBe(true);
      });
    }
  });
});

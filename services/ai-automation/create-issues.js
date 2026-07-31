#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Leggi il token direttamente dal file .env
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const tokenMatch = envContent.match(/GITHUB_TOKEN=(.+)/);
const GITHUB_TOKEN = tokenMatch ? tokenMatch[1].trim() : null;

const REPO = 'MyZubster-Ecosystem/myzubster';
const [owner, repo] = REPO.split('/');

if (!GITHUB_TOKEN || GITHUB_TOKEN === 'your_github_token_here') {
    console.error('❌ GITHUB_TOKEN non trovato nel .env');
    console.log('📝 Assicurati che il file .env contenga: GITHUB_TOKEN=il_tuo_token');
    process.exit(1);
}

console.log(`✅ Token trovato: ${GITHUB_TOKEN.substring(0, 10)}...`);

const headers = {
    'Authorization': `Bearer ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
};

const API_URL = 'https://api.github.com';

// Label da creare
const labels = [
    { name: 'setup', color: '006b75', description: 'Setup e configurazione iniziale' },
    { name: 'feature', color: '1d76db', description: 'Nuova funzionalità' },
    { name: 'enhancement', color: '84b6eb', description: 'Miglioramento esistente' },
    { name: 'bug', color: 'd73a4a', description: 'Bug da risolvere' },
    { name: 'documentation', color: '0075ca', description: 'Documentazione' },
    { name: 'good-first-issue', color: '7057ff', description: 'Buon primo issue per contributori' },
    { name: 'telegram', color: '2e9b4a', description: 'Integrazione Telegram' },
    { name: 'github', color: '1b8cce', description: 'Integrazione GitHub' },
    { name: 'ai', color: 'f97316', description: 'Modelli AI e analisi' },
    { name: 'frontend', color: '1b8cce', description: 'Dashboard e UI' },
    { name: 'backend', color: 'e36209', description: 'Backend API' },
    { name: 'integration', color: 'd4c5f9', description: 'Integrazioni esterne' },
    { name: 'priority-high', color: 'b60205', description: 'Alta priorità' },
    { name: 'priority-medium', color: 'f9d0c4', description: 'Media priorità' },
    { name: 'priority-low', color: '0e8a16', description: 'Bassa priorità' }
];

// Issue da creare
const issues = [
    {
        title: '[Setup] Configurare il Bot Telegram con token e chat ID',
        body: `## 📋 Descrizione
Configurare il bot Telegram per ricevere e inviare notifiche dal sistema AI Automation.

## ✅ Tasks
- [ ] Creare un bot su Telegram con @BotFather
- [ ] Ottenere il token del bot
- [ ] Ottenere il chat ID del canale/gruppo
- [ ] Aggiornare il file \`.env\` con le credenziali
- [ ] Testare l'invio di un messaggio di test

## 📚 Documentazione
- [Node Telegram Bot API](https://github.com/yagop/node-telegram-bot-api)`,
        labels: ['setup', 'telegram', 'good-first-issue']
    },
    {
        title: '[Setup] Integrare GitHub Monitor con Personal Access Token',
        body: `## 📋 Descrizione
Configurare il GitHub Monitor per tracciare issues e PR nei repository MyZubster.

## ✅ Tasks
- [ ] Creare un Personal Access Token su GitHub
- [ ] Configurare i permessi del token (repo, read:org)
- [ ] Aggiornare il file \`.env\` con il token
- [ ] Configurare il repository da monitorare
- [ ] Testare la connessione con GitHub API`,
        labels: ['setup', 'github', 'good-first-issue']
    },
    {
        title: '[Feature] Creare dashboard web per monitorare il sistema',
        body: `## 📋 Descrizione
Creare una dashboard web per visualizzare lo stato del sistema AI Automation in tempo reale.

## ✅ Tasks
- [ ] Creare un endpoint \`/dashboard\` con Express
- [ ] Visualizzare lo stato dei servizi (Telegram, GitHub, AI)
- [ ] Mostrare gli ultimi issues analizzati
- [ ] Visualizzare i bounty attivi`,
        labels: ['feature', 'frontend', 'enhancement']
    },
    {
        title: '[Enhancement] Migliorare l\'analisi AI con prompt engineering',
        body: `## 📋 Descrizione
Ottimizzare i prompt per l'AI Orchestrator per ottenere analisi più accurate e strutturate.

## ✅ Tasks
- [ ] Rivedere il prompt per l'analisi degli issue
- [ ] Aggiungere esempi nel prompt (few-shot learning)
- [ ] Migliorare l'estrazione delle informazioni
- [ ] Aggiungere analisi del sentiment`,
        labels: ['enhancement', 'ai', 'good-first-issue']
    },
    {
        title: '[Feature] Aggiungere supporto per notifiche Slack',
        body: `## 📋 Descrizione
Integrare Slack come canale di notifica alternativo a Telegram.

## ✅ Tasks
- [ ] Creare un'app Slack e ottenere webhook URL
- [ ] Implementare il modulo \`src/slack/notifier.js\`
- [ ] Aggiungere configurazione nel \`.env\`
- [ ] Testare l'invio di notifiche`,
        labels: ['feature', 'integration', 'enhancement']
    },
    {
        title: '[Documentation] Creare documentazione API completa',
        body: `## 📋 Descrizione
Creare documentazione completa per le API del sistema AI Automation.

## ✅ Tasks
- [ ] Documentare tutti gli endpoint API
- [ ] Aggiungere esempi di richiesta/risposta
- [ ] Creare una guida per l'integrazione
- [ ] Documentare il formato dei webhook`,
        labels: ['documentation', 'good-first-issue']
    }
];

// Funzione per creare una label
async function createLabel(label) {
    try {
        await axios.post(`${API_URL}/repos/${owner}/${repo}/labels`, label, { headers });
        console.log(`✅ Label creata: ${label.name}`);
    } catch (error) {
        if (error.response?.status === 422) {
            console.log(`⚠️ Label già esistente: ${label.name}`);
        } else {
            console.error(`❌ Errore creazione label ${label.name}: ${error.response?.data?.message || error.message}`);
        }
    }
}

// Funzione per creare un issue
async function createIssue(issue) {
    try {
        const response = await axios.post(`${API_URL}/repos/${owner}/${repo}/issues`, issue, { headers });
        console.log(`✅ Issue creata: #${response.data.number} - ${issue.title}`);
    } catch (error) {
        console.error(`❌ Errore creazione issue: ${error.response?.data?.message || error.message}`);
    }
}

// Funzione principale
async function main() {
    console.log(`🚀 Creazione label e issue per ${owner}/${repo}\n`);

    console.log('📝 Creazione label...');
    for (const label of labels) {
        await createLabel(label);
    }

    console.log('\n📝 Creazione issues...');
    for (const issue of issues) {
        await createIssue(issue);
    }

    console.log(`\n✅ Complete! Visualizza: https://github.com/${owner}/${repo}/issues`);
}

main();

 🌱 MyZubster - AI Automation System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## 📋 Overview

MyZubster is an AI-powered automation system for managing bounties, issues, and notifications across GitHub, Telegram, and Slack. It uses intelligent agents to analyze, prioritize, and process tasks.

## 🚀 Features

- **AI Orchestrator**: Intelligent task routing and queue management
- **Multi-Agent System**: Plant, Pet, Payment, Verification agents
- **Notification System**: Multi-channel (Telegram + Slack) with automatic fallback
- **Dashboard**: Real-time monitoring of services and issues
- **GitHub Integration**: Automatic issue analysis and processing
- **Monero (XMR) Support**: Payment processing and bounty management
- **Long-Term Memory**: TTL-aware cache with store/retrieve/query operations

## 📦 Installation

### Prerequisites
- Node.js 20.x
- MongoDB 6.x
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/MyZubster-Ecosystem/myzubster.git
cd myzubster

# Install dependencies
npm install
cd backend && npm install
cd ../services/ai-automation && npm install

# Configure environment
cp .env.example .env
cp backend/.env.example backend/.env
cp services/ai-automation/.env.example services/ai-automation/.env

# Start the system
./start-backend.sh

⚙️ Configuration
Environment Variables
env

# Server
PORT=3009
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/myzubster

# Telegram (fallback channel)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Slack (preferred channel)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# GitHub
GITHUB_TOKEN=your_github_token
GITHUB_REPO=MyZubster-Ecosystem/myzubster

# Monero (XMR)
XMR_WALLET_ADDRESS=your_wallet_address
XMR_RPC_URL=http://localhost:18081

📚 Documentation

Complete API documentation is available in the docs/ directory:

    API Reference

    AI Contract

    Bot Contract

🏗️ Architecture
text

┌─────────────────────────────────────────────────────────────┐
│                    MyZubster System                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐│
│  │   Express   │  │  AI        │  │   Notification      ││
│  │   Backend   │  │Orchestrator│  │   System            ││
│  │   Port 3009 │  │            │  │   (Slack/Telegram)  ││
│  └─────────────┘  └─────────────┘  └─────────────────────┘│
│         │              │                      │           │
│  ┌──────▼──────┐  ┌────▼────┐  ┌────────────▼──────────┐│
│  │  MongoDB   │  │ Agents  │  │  GitHub Integration   ││
│  │  Database  │  │ Plant   │  │  (Issues/Bounties)    ││
│  └────────────┘  │ Pet     │  └────────────────────────┘│
│                  │ Payment │                              │
│                  │Verific. │                              │
│                  └─────────┘                              │
└─────────────────────────────────────────────────────────────┘

🧪 Testing
bash

# Run all tests
npm test

# Run backend tests
cd backend && npm test

# Run AI Automation tests
cd services/ai-automation && npm test

# Run dashboard tests
node backend/test-dashboard.js

📊 Dashboard

Access the dashboard at: http://localhost:3009/dashboard

The dashboard shows:

    Service status (Telegram, Slack, GitHub, AI, MongoDB)

    Recent issues

    Active bounties

    System statistics

🤝 Contributing

We welcome contributions! Please see:

    Contributing Guide

    Code of Conduct

Development Workflow

    Fork the repository

    Create a feature branch (git checkout -b feat/amazing-feature)

    Commit changes (git commit -m 'Add amazing feature')

    Push to branch (git push origin feat/amazing-feature)

    Open a Pull Request

📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgments

    Contributors and maintainers

    Open-source community

    All MyZubster users

📞 Contact

    GitHub: @MyZubster-Ecosystem

    Telegram: @MyZubsterBot

Built with ❤️ by the MyZubster Team

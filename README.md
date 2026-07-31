<<<<<<< HEAD

🤖 AI-powered automation system for MyZubster open-source ecosystem.
[![GitHub release](https://img.shields.io/github/release/MyZubster-Ecosystem/ai-automation.svg)](https://github.com/MyZubster-Ecosystem/ai-automation/releases)
[![GitHub license](https://img.shields.io/github/license/MyZubster-Ecosystem/ai-automation.svg)](https://github.com/MyZubster-Ecosystem/ai-automation/blob/main/LICENSE)
[![GitHub issues](https://img.shields.io/github/issues/MyZubster-Ecosystem/ai-automation.svg)](https://github.com/MyZubster-Ecosystem/ai-automation/issues)
[![GitHub stars](https://img.shields.io/github/stars/MyZubster-Ecosystem/ai-automation.svg)](https://github.com/MyZubster-Ecosystem/ai-automation/stargazers
## 🚀 Features

- **🤖 AI-Powered Analysis**: Uses local AI models (Gemma, Llama, DeepSeek) to analyze GitHub issues
- **📱 Telegram Bot**: Interactive bot for managing bounties, checking status, and receiving notifications
- **🐙 GitHub Integration**: Automatic monitoring of issues and PRs
- **💰 Bounty Management**: Automatic bounty creation and management
- **🔔 Real-time Notifications**: Instant alerts for new issues and bounty updates
- **🔄 Multi-Model Fallback**: Switches between AI models for reliability

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB
- Ollama (for local AI models)
- Telegram Bot Token
- GitHub Personal Access Token

## 🛠️ Installation

### 1. Clone the repository

```bash
git clone https://github.com/MyZubster-Ecosystem/ai-automation.git
cd ai-automation

2. Install dependencies
bash

npm install

3. Configure environment
bash

cp .env.example .env
nano .env

4. Start the system
bash

npm start

🧠 AI Models

The system uses three AI models with automatic fallback:
Model	Provider	Size	Purpose
Gemma 2B	Google	1.7 GB	Default - Fast and lightweight
Llama 3.2	Meta	2.0 GB	Fallback - More powerful
DeepSeek R1	DeepSeek	1.1 GB	Fallback - Reasoning
Setup AI Models
bash

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull gemma:2b
ollama pull llama3.2:3b
ollama pull deepseek-r1:1.5b

📁 Project Structure
text

ai-automation/
├── src/
│   ├── telegram/
│   │   └── bot.js          # Telegram bot handler
│   ├── github/
│   │   └── monitor.js      # GitHub monitoring
│   ├── ai/
│   │   └── orchestrator.js # AI model orchestration
│   └── orchestrator/
│       └── index.js        # Main automation orchestrator
├── logs/                   # Log files
├── index.js               # Main entry point
├── package.json
├── .env.example
└── README.md

🔧 Configuration
Environment Variables
env

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# GitHub
GITHUB_TOKEN=your_github_token
GITHUB_REPO=MyZubster-Ecosystem/MyZubsterGateway

# AI Models
DEEPSEEK_API_KEY=your_deepseek_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1
GEMMA_API_URL=http://localhost:11434/api
GEMMA_MODEL=gemma:2b
LLAMA_MODEL=llama3.2:3b
DEFAULT_AI_MODEL=gemma:2b

# Backend
BACKEND_URL=http://localhost:3002
BACKEND_API_KEY=your_backend_key

# System
PORT=5678
MONITOR_INTERVAL=300000

🚀 Usage
Starting the System
bash

# Development mode
npm run dev

# Production mode
npm start

# As a systemd service
sudo systemctl start myzubster-ai

Telegram Commands

Once the bot is running, send these commands:

    /start - Welcome message

    /status - Check system status

    /bounties - View active bounties

    /github - Check GitHub activity

    /analyze - AI analysis of issues

    /help - Show help message

API Endpoints

The system exposes a REST API:

    GET /health - System health check

    GET /api/status - Service status

    POST /api/github/issue - Submit issue for analysis

📊 Monitoring
bash

# Check system health
curl http://localhost:5678/health

# View logs
sudo journalctl -u myzubster-ai -f

# Check service status
sudo systemctl status myzubster-ai

🏗️ Deployment
Systemd Service

Create a systemd service file:
ini

[Unit]
Description=MyZubster AI Automation Service
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/myzubster/ai-automation
ExecStart=/usr/bin/node /root/myzubster/ai-automation/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5678

[Install]
WantedBy=multi-user.target

Enable and start:
bash

sudo systemctl daemon-reload
sudo systemctl enable myzubster-ai
sudo systemctl start myzubster-ai

🤝 Contributing

    Fork the repository

    Create your feature branch (git checkout -b feature/amazing-feature)

    Commit your changes (git commit -m 'Add some amazing feature')

    Push to the branch (git push origin feature/amazing-feature)

    Open a Pull Request

📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgments

    Ollama - Local AI model runner

    Google Gemma - Lightweight AI model

    Meta Llama - Powerful language model

    DeepSeek - Reasoning model

📧 Contact

    Website: MyZubster.com

    GitHub: @MyZubster-Ecosystem

    Twitter: @MyZubster

Made with ❤️ by the MyZubster Team
=======
# 🌱 MyZubster

**Decentralized ecosystem for plant mapping, privacy-first payments, and human-centered AI.**

---

## 🌍 What is MyZubster?

MyZubster is an open-source ecosystem that combines three pillars:

- **🌿 Global Plant Map** – a participatory, verified map of plants around the world.
- **🔒 Monero Payments** – privacy-first, feeless microtransactions for everyone.
- **🤖 Human-Controlled AI** – AI as a tool, not a master.

It is built for people who believe in a better, more transparent, and decentralized future.

---

## 🧱 Architecture

The ecosystem is composed of several services:

| Component | Description | Tech Stack | Repo |
|-----------|-------------|------------|------|
| **Gateway** | Monero payment processor & API orchestrator | Node.js, Express, MongoDB, Monero RPC | [MyZubsterGateway](https://github.com/DanielIoni-creator/MyZubsterGateway) |
| **Marketplace** | User-facing platform for plants, orders, and reputation | Node.js, SQLite | [MyZubster-Marketplace](https://github.com/DanielIoni-creator/MyZubster-Marketplace) |
| **Mobile App** | Android app for plant mapping and payments | React Native / Kotlin | [MyZubster-App](https://github.com/DanielIoni-creator/MyZubster-App) |
| **Web App** | React/Vite frontend for desktop users | React, Vite, Tailwind | [MyZubsterWeb](https://github.com/DanielIoni-creator/MyZubsterWeb) |
| **Docs** | Centralized documentation for developers and users | Markdown, VitePress | [myzubster-docs](https://github.com/DanielIoni-creator/myzubster-docs) |
| **Animal Registry** | Decentralized animal registry on blockchain | (Tari/Blockchain) | [myzubster-animal-registry](https://github.com/DanielIoni-creator/myzubster-animal-registry) |
| **Animal Map** | Interactive map for animal registry | (Map/Visualization) | [myzubster-animal-map](https://github.com/DanielIoni-creator/myzubster-animal-map) |

---

## 🚀 Getting Started

Each component has its own README with setup instructions. Start with the [Gateway](https://github.com/DanielIoni-creator/MyZubsterGateway) for the core payment system.

---

## 🤝 How to Contribute

We welcome all kinds of contributions:

- 💻 **Code** – fix bugs, add features, improve performance
- 🌿 **Data** – report plants, verify entries, expand the map
- 🗣️ **Outreach** – write articles, talk about the project, bring new users
- 💰 **Donations** – support development via Monero (address in the Gateway repo)

Check the [issues](https://github.com/DanielIoni-creator/MyZubsterGateway/issues) and the [roadmap](https://github.com/users/DanielIoni-creator/projects/1) to see where help is needed.

---

## 📜 License

All components are licensed under the **MIT License** – free for everyone to use, modify, and distribute.

---

## 🙏 Support & Contact

- **GitHub**: [DanielIoni-creator](https://github.com/DanielIoni-creator)
- **Project Board**: [Roadmap](https://github.com/users/DanielIoni-creator/projects/1)
- **Issues**: [Report a bug](https://github.com/DanielIoni-creator/MyZubsterGateway/issues)

---

*Built with ❤️ and ☕ by Daniel Ioni, with the help of the open-source community.*


## 💬 Community

- **Telegram**: [@MyZubster_bot](https://t.me/MyZubster_bot) – for updates, support, and discussions.


## 🌐 Connect with Us

- **Telegram**: [@MyZubster_bot](https://t.me/MyZubster_bot) – updates, support, and discussions
- **Twitter / X**: [@DanielIoni](https://twitter.com/DanielIoni) – project announcements and thoughts
- **TikTok**: [@danielioni](https://tiktok.com/@danielioni) – behind the scenes and project updates
- **Instagram**: [@danielioni](https://instagram.com/danielioni) – visuals and community stories
- **dev.to**: [Daniel Ioni](https://dev.to/danielioni) – technical articles and project updates


## 💬 Community

- **Telegram Channel**: [@myzubster](https://t.me/myzubster) – follow for updates, news, and discussions about the MyZubster ecosystem.
>>>>>>> 2d840d3138c125e8384e8db07ce71c667ea32607

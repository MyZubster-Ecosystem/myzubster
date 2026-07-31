# 🤖 MyZubster AI Automation Service

AI-powered automation service for the MyZubster ecosystem.

## 🚀 Features

- **📱 Telegram Bot** - @myzubster_bot for notifications and commands
- **🐙 GitHub Monitor** - Automatic monitoring of issues and PRs
- **🧠 AI Orchestrator** - Analysis with Gemma, Llama, and DeepSeek
- **💰 Bounty Creator** - Automatic bounty creation
- **🔔 Notifications** - Real-time alerts on Telegram
- **🔄 Multi-Model Fallback** - Automatic switching between AI models

## 📋 Prerequisites

- Node.js (v18+)
- MongoDB (for backend)
- Ollama (for local AI models)
- Telegram Bot Token
- GitHub Personal Access Token

## 🛠️ Installation

```bash
# Navigate to the service directory
cd services/ai-automation

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
nano .env
🔧 Configuration
.env File
env

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# GitHub Configuration
GITHUB_TOKEN=your_github_token_here
GITHUB_REPO=MyZubster-Ecosystem/myzubster

# AI Models - DeepSeek API (optional)
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1

# AI Models - Local Ollama
GEMMA_API_URL=http://localhost:11434/api
GEMMA_MODEL=gemma:2b
LLAMA_MODEL=llama3.2:3b
DEFAULT_AI_MODEL=gemma:2b

# Backend API (optional)
BACKEND_URL=http://localhost:3002
BACKEND_API_KEY=your_backend_api_key_here

# System Configuration
PORT=5678
MONITOR_INTERVAL=300000
NODE_ENV=production

# MongoDB (optional - if using backend)
MONGODB_URI=mongodb://localhost:27017/myzubster

🚀 Running
Development
bash

npm run dev

Production
bash

npm start

As systemd service
bash

# Create service file
sudo nano /etc/systemd/system/myzubster-ai.service

# Service file content:
[Unit]
Description=MyZubster AI Automation Service
After=network.target mongod.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/myzubster/myzubster-merged/services/ai-automation
ExecStart=/usr/bin/node /root/myzubster/myzubster-merged/services/ai-automation/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5678

[Install]
WantedBy=multi-user.target

# Start the service
sudo systemctl daemon-reload
sudo systemctl enable myzubster-ai
sudo systemctl start myzubster-ai
sudo systemctl status myzubster-ai

📱 Telegram Commands

The @myzubster_bot responds to the following commands:
Command	Description
/start	Welcome message and guide
/status	System and services status
/github	Recent GitHub activity
/bounties	List of active bounties
/analyze	AI analysis of an issue
/help	Show all available commands
📊 API Endpoints
Endpoint	Method	Description
/health	GET	System health check
/api/status	GET	Detailed service status
/api/analyze	POST	AI analysis of an issue
/api/github/issue	POST	Submit issue for analysis
🧠 AI Models

The system supports three models with automatic fallback:
Model	Provider	Size	Usage
Gemma 2B	Google	1.7 GB	Default - Fast and lightweight
Llama 3.2 3B	Meta	2.0 GB	Fallback - More powerful
DeepSeek R1 1.5B	DeepSeek	1.1 GB	Fallback - Reasoning
AI Models Setup
bash

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull models
ollama pull gemma:2b
ollama pull llama3.2:3b
ollama pull deepseek-r1:1.5b

# Verify installed models
ollama list

# Test a model
ollama run gemma:2b "Hello, test!"

📁 Project Structure
text

services/ai-automation/
├── src/
│   ├── telegram/
│   │   └── bot.js           # Telegram bot handler
│   ├── github/
│   │   └── monitor.js       # GitHub monitor
│   ├── ai/
│   │   └── orchestrator.js  # AI orchestrator
│   └── orchestrator/
│       └── index.js         # Main orchestrator
├── logs/
│   ├── combined.log         # General log
│   └── error.log            # Error log
├── scripts/
│   └── ...                  # Utility scripts
├── .env.example             # Configuration template
├── index.js                 # Entry point
├── package.json
├── create-issues.js         # GitHub issues creator
└── README.md

🔍 Monitoring
Health Check
bash

curl http://localhost:5678/health

Logs
bash

# systemd service logs
sudo journalctl -u myzubster-ai -f

# File logs
tail -f logs/combined.log

🐛 Troubleshooting
Port already in use
bash

sudo lsof -i :5678
sudo kill -9 <PID>

MongoDB not connected
bash

sudo systemctl restart mongod
sudo systemctl status mongod

Ollama not responding
bash

sudo systemctl restart ollama
ollama list  # Verify installed models

Invalid Telegram token
bash

curl "https://api.telegram.org/bot<TOKEN>/getMe"

GitHub API errors
bash

# Verify token is valid
curl -H "Authorization: token <GITHUB_TOKEN>" https://api.github.com/user

# Check rate limit
curl -H "Authorization: token <GITHUB_TOKEN>" https://api.github.com/rate_limit

🤝 Contributing

    Fork the repository

    Create your feature branch (git checkout -b feature/amazing-feature)

    Commit your changes (git commit -m 'Add some amazing feature')

    Push to the branch (git push origin feature/amazing-feature)

    Open a Pull Request

📝 License

MIT License - See the LICENSE file for details.
🙏 Acknowledgments

    Ollama - Local AI model runner

    Google Gemma - Lightweight AI model

    Meta Llama - Powerful language model

    DeepSeek - Reasoning model

📧 Contact

    GitHub: MyZubster-Ecosystem

    Telegram: @myzubster_bot

    Channel: @myzubster

Built with ❤️ by the MyZubster Team

## 📚 Documentazione

La documentazione completa di MyZubster è disponibile nel repository [myzubster-docs](https://github.com/MyZubster-Ecosystem/myzubster-docs).

### Guide
- [Guida pratica per l'uso dell'orto intelligente](docs/guides/GUIDA_ORTO_INTELLIGENTE.md) - IT/EN

### Educazione
- [Piano didattico per scuole](docs/education/PIANO_DIDATTICO_SCUOLE.md) - Programma STEM (11-18 anni)
- [Progetto orti scolastici](docs/education/PROGETTO_ORTI_SCOLASITICI.md) - Toolkit sostenibile

### Ricerca
- [Protocollo di validazione sensori](docs/research/PROTOCOLLO_VALIDAZIONE.md) - Validazione scientifica

### Template
- [Template orto comunitario](docs/guides/TEMPLATE_ORTO_COMUNITARIO.md) - Setup e gestione

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
## 🪙 $MYZ Rewards System

MyZubster now offers rewards in $MYZ tokens for various activities:

- 🖥️ Open‑source contributions (bounties on merged PRs)
- 🐛 QA and bug reporting
- 🤖 Robot mission bonuses
- 👥 User referrals
- 🗳️ Governance participation
- 📚 Educational content creation

Check the labels `rewards` and `myz` for available reward opportunities.

---

## 💰 Earn Your First XMR

Want to start earning **Monero (XMR)** without any capital? Every reward-generating action across the ecosystem is collected in one place:

👉 **[Earn Your First XMR — full guide & action list](docs/EARN_YOUR_FIRST_XMR.md)**

It covers plant/animal registrations, verification, free documentation, valid bug reports, open-source bounties, community contributions, payout mechanics, and a zero-capital step-by-step.

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

## 🐳 Docker One-Command Deployment

The entire MyZubster ecosystem can be launched with a single Docker Compose command.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v24+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.20+)

### Quick Start

```bash
# 1. Clone the main repository
git clone https://github.com/MyZubster-Ecosystem/myzubster.git
cd myzubster

# 2. (Optional) Configure environment
cp .env.docker .env
# Edit .env to set passwords, tokens, etc.

# 3. Launch everything with one command
docker compose up -d

# 4. Check service status
docker compose ps
docker compose logs -f

# 5. Verify health endpoints
curl http://localhost:3009/health   # Backend
curl http://localhost:3000          # Frontend
curl http://localhost:3001/health   # Gateway
curl http://localhost:4000/api/health # Marketplace
curl http://localhost:5000/health   # AI Automation
```

### Services Overview

| Service | Port | Description | Health Check |
|---------|------|-------------|--------------|
| **mongodb** | 27017 | Database (MongoDB 7) with persistent volume | `mongosh ping` |
| **backend** | 3009 | Node.js + Express + Mongoose API | `GET /health` |
| **frontend** | 3000 | React 18 + react-leaflet map (nginx-served) | `GET /` |
| **gateway** | 3001 | Express API Gateway (MongoDB + Monero) | `GET /health` |
| **marketplace** | 4000 | Express + SQLite marketplace | `GET /api/health` |
| **ai-automation** | 5000 | AI service with GitHub + Telegram + cron | `GET /health` |

### Environment Variables

Key variables (see `.env.docker` for the full template):

| Variable | Default | Description |
|----------|---------|-------------|
| `MONGO_INITDB_ROOT_PASSWORD` | `changeme_in_production` | MongoDB root password |
| `BACKEND_MONGODB_URI` | `mongodb://...` | Backend MongoDB connection string |
| `REACT_APP_API_URL` | `http://localhost:3009` | Backend URL from frontend |
| `JWT_SECRET` | `changeme_in_production` | Gateway JWT signing secret |
| `TELEGRAM_BOT_TOKEN` | _(empty)_ | AI Automation Telegram bot token |
| `GITHUB_TOKEN` | _(empty)_ | AI Automation GitHub API token |

### Data Persistence

- **MongoDB data** stored in Docker volumes `mongodb_data` and `mongodb_config`
- **Marketplace SQLite** stored in Docker volume `marketplace_data`
- All volumes survive container restarts and `docker compose down`

### Centralized Logging

```bash
# View logs from all services
docker compose logs -f

# View logs from a specific service
docker compose logs -f backend
docker compose logs -f ai-automation

# Tail with timestamps
docker compose logs -f --tail=100
```

### Shutdown

```bash
# Stop all services (preserves data)
docker compose down

# Stop all services and delete volumes (⚠️ destroys data)
docker compose down -v
```

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

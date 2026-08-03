# 🚀 Hackathon Getting Started Guide

Welcome to MyZubster Hackathon 2026! This guide will help you get up and running quickly.

## 📋 Prerequisites

Before you begin, make sure you have:

- [ ] Git installed ([Download](https://git-scm.com/))
- [ ] Node.js 18+ installed ([Download](https://nodejs.org/))
- [ ] GitHub account ([Sign up](https://github.com/))
- [ ] Code editor (VS Code recommended)
- [ ] Docker (optional, for full stack)

## 🏃 Quick Start

### 1. Fork the Repository

```bash
# Go to https://github.com/MyZubster-Ecosystem/myzubster
# Click the "Fork" button in the top right
```

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/myzubster.git
cd myzubster
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## 🐳 Docker Setup (Optional)

For the full stack experience:

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## 📁 Project Structure

```
myzubster/
├── src/
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── middleware/       # Express middleware
│   └── utils/           # Utility functions
├── frontend/
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       └── api/         # API client
├── docs/                # Documentation
├── loadtest/            # Load testing scripts
└── package.json
```

## 🔧 Development Workflow

### 1. Create a Branch

```bash
git checkout -b feat/your-feature-name
```

Branch naming conventions:
- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `test/` - Tests

### 2. Make Changes

Edit files in your code editor. The server will auto-reload.

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Run specific test
npm test -- --grep "plant"
```

### 4. Commit Your Changes

```bash
git add .
git commit -m "feat: add amazing feature

- Description of what you did
- Any important notes

Fixes #issue-number"
```

### 5. Push and Create PR

```bash
git push origin feat/your-feature-name
```

Then go to GitHub and create a Pull Request.

## 📚 API Reference

### Plants API

```bash
# Get all plants
GET /api/plants

# Get plant by ID
GET /api/plants/:id

# Search plants
GET /api/plants?search=tomato
```

### Animals API

```bash
# Get all animals
GET /api/animals

# Get animal by ID
GET /api/animals/:id
```

### Bounties API

```bash
# Get all bounties
GET /api/bounties

# Get bounty by ID
GET /api/bounties/:id
```

## 🎨 UI Components

The frontend uses React with these key components:

- `MapContainer` - Interactive map view
- `SearchBox` - Location search
- `RoutePlanner` - Route planning
- `POIMarker` - Points of interest

## 🐛 Debugging

### Common Issues

**Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

**Database errors:**
```bash
# Reset database
rm -f data/myzubster.db
npm run db:init
```

**Node modules issues:**
```bash
# Clean install
rm -rf node_modules
npm install
```

### Debug Mode

```bash
# Start with debugging
DEBUG=myzubster:* npm run dev
```

## 📖 Helpful Resources

- [Node.js Documentation](https://nodejs.org/en/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [SQLite Documentation](https://www.sqlite.org/docs.html)

## 🤝 Getting Help

- **Discord:** Join #hackathon-2026 channel
- **Issues:** Open a GitHub issue
- **Discussions:** Use GitHub Discussions

## ✅ Checklist Before Submission

- [ ] Code runs without errors
- [ ] Tests pass
- [ ] Documentation updated
- [ ] PR description complete
- [ ] Demo ready (screenshots/video)
- [ ] Team members credited

---

**Happy hacking! 🌱**

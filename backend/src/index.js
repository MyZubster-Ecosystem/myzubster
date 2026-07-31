const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const Message = require('./models/Message');
const { getDashboardData } = require('./dashboard');

const app = express();
const port = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/myzubster';

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error.message);
  });

app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'MyZubster backend is running' });
});

// Dashboard API endpoint
app.get('/api/dashboard', async (_req, res) => {
  try {
    const data = getDashboardData();
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore recupero dati dashboard',
      error: error.message
    });
  }
});

// Dashboard page endpoint
app.get('/dashboard', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MyZubster - Dashboard Sistema AI Automation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background: #0f172a; color: #e2e8f0; min-height: 100vh; }
    .container { max-width: 1400px; margin: 0 auto; padding: 2rem; }
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid #1e293b; }
    h1 { font-size: 1.8rem; background: linear-gradient(135deg, #10b981, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .refresh-btn { background: #1e293b; color: #e2e8f0; border: 1px solid #334155; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer; transition: all 0.2s; }
    .refresh-btn:hover { background: #334155; }
    .timestamp { font-size: 0.875rem; color: #94a3b8; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .card { background: #1e293b; border-radius: 1rem; padding: 1.5rem; border: 1px solid #334155; }
    .card h2 { font-size: 1.1rem; color: #94a3b8; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .status-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }
    .status-online { background: #065f46; color: #6ee7b7; }
    .status-offline { background: #7f1d1d; color: #fca5a5; }
    .status-degraded { background: #78350f; color: #fcd34d; }
    .dot { width: 8px; height: 8px; border-radius: 50%; }
    .dot-online { background: #10b981; box-shadow: 0 0 8px #10b981; }
    .dot-offline { background: #ef4444; }
    .dot-degraded { background: #f59e0b; }
    .service-details { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #334155; }
    .detail-row { display: flex; justify-content: space-between; padding: 0.25rem 0; font-size: 0.875rem; }
    .detail-label { color: #64748b; }
    .detail-value { color: #e2e8f0; font-family: monospace; }
    .section-title { font-size: 1.25rem; margin-bottom: 1rem; color: #f1f5f9; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.75rem; border-bottom: 1px solid #334155; font-size: 0.875rem; }
    th { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
    tr:hover { background: #334155; }
    .badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 500; }
    .badge-open { background: #1e3a5f; color: #60a5fa; }
    .badge-in-progress { background: #1e3a5f; color: #a78bfa; }
    .badge-completed { background: #065f46; color: #6ee7b7; }
    .badge-claimed { background: #78350f; color: #fcd34d; }
    .badge-failed { background: #7f1d1d; color: #fca5a5; }
    .badge-pending { background: #451a03; color: #fdba74; }
    .loading { text-align: center; padding: 2rem; color: #64748b; }
    .error { text-align: center; padding: 2rem; color: #fca5a5; }
    .bounty-reward { font-family: monospace; color: #10b981; }
    @media (max-width: 768px) { .container { padding: 1rem; } .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🌱 MyZubster Dashboard</h1>
      <div style="display:flex;align-items:center;gap:1rem;">
        <span class="timestamp" id="timestamp">Loading...</span>
        <button class="refresh-btn" onclick="loadDashboard()">🔄 Refresh</button>
      </div>
    </header>

    <div class="grid" id="services">
      <div class="loading">Caricamento servizi...</div>
    </div>

    <h2 class="section-title">📋 Recent Issues Analizzati</h2>
    <div class="card" id="issues">
      <div class="loading">Caricamento issues...</div>
    </div>

    <h2 class="section-title" style="margin-top:2rem;">💰 Active Bounties</h2>
    <div class="card" id="bounties">
      <div class="loading">Caricamento bounties...</div>
    </div>
  </div>

  <script>
    async function loadDashboard() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const data = await res.json();
        
        document.getElementById('timestamp').textContent = 'Updated: ' + new Date(data.timestamp).toLocaleString('it-IT');

        // Render services
        const servicesHtml = \`
          <div class="card">
            <h2>🤖 AI Automation</h2>
            <span class="status-badge \${data.services.ai.status === 'online' ? 'status-online' : 'status-degraded'}">
              <span class="dot \${data.services.ai.status === 'online' ? 'dot-online' : 'dot-degraded'}"></span>
              \${data.services.ai.status.toUpperCase()}
            </span>
            <div class="service-details">
              <div class="detail-row"><span class="detail-label">Agents attivi</span><span class="detail-value">\${data.services.ai.agents}</span></div>
              <div class="detail-row"><span class="detail-label">Task attivi</span><span class="detail-value">\${data.services.ai.details.activeTasks || 0}</span></div>
              <div class="detail-row"><span class="detail-label">Coda</span><span class="detail-value">\${data.services.ai.details.queueLength || 0}</span></div>
              <div class="detail-row"><span class="detail-label">Latenza</span><span class="detail-value">\${data.services.ai.latency}</span></div>
            </div>
          </div>
          <div class="card">
            <h2>💬 Slack</h2>
            <span class="status-badge ${data.services.slack.status === 'online' ? 'status-online' : 'status-offline'}">
              <span class="dot ${data.services.slack.status === 'online' ? 'dot-online' : 'dot-offline'}"></span>
              ${data.services.slack.status.toUpperCase()}
            </span>
            <div class="service-details">
              <div class="detail-row"><span class="detail-label">Webhook</span><span class="detail-value">${data.services.slack.details.webhook}</span></div>
              <div class="detail-row"><span class="detail-label">Canale</span><span class="detail-value">${data.services.slack.details.channel}</span></div>
              <div class="detail-row"><span class="detail-label">Latenza</span><span class="detail-value">${data.services.slack.latency}</span></div>
            </div>
          </div>
          <div class="card">
            <h2>📱 Telegram</h2>
            <span class="status-badge \${data.services.telegram.status === 'online' ? 'status-online' : 'status-offline'}">
              <span class="dot \${data.services.telegram.status === 'online' ? 'dot-online' : 'dot-offline'}"></span>
              \${data.services.telegram.status.toUpperCase()}
            </span>
            <div class="service-details">
              <div class="detail-row"><span class="detail-label">Bot</span><span class="detail-value">\${data.services.telegram.details.botUsername}</span></div>
              <div class="detail-row"><span class="detail-label">Webhook</span><span class="detail-value">\${data.services.telegram.details.webhook}</span></div>
              <div class="detail-row"><span class="detail-label">Latenza</span><span class="detail-value">\${data.services.telegram.latency}</span></div>
            </div>
          </div>
          <div class="card">
            <h2>🐙 GitHub</h2>
            <span class="status-badge \${data.services.github.status === 'online' ? 'status-online' : 'status-offline'}">
              <span class="dot \${data.services.github.status === 'online' ? 'dot-online' : 'dot-offline'}"></span>
              \${data.services.github.status.toUpperCase()}
            </span>
            <div class="service-details">
              <div class="detail-row"><span class="detail-label">Repository</span><span class="detail-value">\${data.services.github.details.repo}</span></div>
              <div class="detail-row"><span class="detail-label">Webhooks</span><span class="detail-value">\${data.services.github.details.webhooks}</span></div>
              <div class="detail-row"><span class="detail-label">Latenza</span><span class="detail-value">\${data.services.github.latency}</span></div>
            </div>
          </div>
        \`;
        document.getElementById('services').innerHTML = servicesHtml;

        // Render recent issues
        const issuesHtml = \`
          <table>
            <thead><tr><th>ID</th><th>Tipo</th><th>Stato</th><th>Timestamp</th></tr></thead>
            <tbody>
              \${data.recentIssues.map(issue => \`
                <tr>
                  <td style="font-family:monospace;">\${issue.id}</td>
                  <td>\${issue.type}</td>
                  <td><span class="badge badge-\${issue.status}">\${issue.status}</span></td>
                  <td style="color:#64748b;">\${new Date(issue.timestamp).toLocaleString('it-IT')}</td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        \`;
        document.getElementById('issues').innerHTML = issuesHtml || '<div class="loading">Nessun issue analizzato recentemente</div>';

        // Render bounties
        const bountiesHtml = \`
          <table>
            <thead><tr><th>ID</th><th>Titolo</th><th>Reward</th><th>Stato</th><th>Assegnato a</th><th>Scadenza</th></tr></thead>
            <tbody>
              \${data.activeBounties.map(b => \`
                <tr>
                  <td style="font-family:monospace;">\${b.id}</td>
                  <td>\${b.title}</td>
                  <td class="bounty-reward">\${b.reward}</td>
                  <td><span class="badge badge-\${b.status}">\${b.status}</span></td>
                  <td>\${b.assignee || '-'}</td>
                  <td style="color:#64748b;">\${new Date(b.expiresAt).toLocaleDateString('it-IT')}</td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        \`;
        document.getElementById('bounties').innerHTML = bountiesHtml;

      } catch (error) {
        document.getElementById('services').innerHTML = '<div class="error">Errore caricamento dati: ' + error.message + '</div>';
        document.getElementById('issues').innerHTML = '<div class="error">Errore caricamento issues</div>';
        document.getElementById('bounties').innerHTML = '<div class="error">Errore caricamento bounties</div>';
      }
    }

    loadDashboard();
    setInterval(loadDashboard, 30000);
  </script>
</body>
</html>`);
});

app.post('/api/messages', async (req, res) => {
  try {
    const { senderId, receiverId, content } = req.body;

    if (!senderId || !receiverId || !content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'senderId, receiverId e content sono obbligatori',
      });
    }

    const message = await Message.create({
      senderId,
      receiverId,
      content: content.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Messaggio inviato',
      data: message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore invio messaggio',
      error: error.message,
    });
  }
});

app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
    }).sort({ timestamp: 1 });

    return res.json({
      success: true,
      message: 'Messaggi utente recuperati',
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore recupero messaggi',
      error: error.message,
    });
  }
});

app.get('/api/messages/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    }).sort({ timestamp: 1 });

    return res.json({
      success: true,
      message: 'Chat recuperata',
      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore recupero chat',
      error: error.message,
    });
  }
});

app.put('/api/messages/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Messaggio non trovato',
      });
    }

    return res.json({
      success: true,
      message: 'Messaggio segnato come letto',
      data: message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Errore aggiornamento messaggio',
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`MyZubster backend listening on port ${port}`);
});

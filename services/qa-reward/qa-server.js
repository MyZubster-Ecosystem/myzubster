/**
 * MyZubster QA Reward System
 * Bug report submission + validation + automatic MYZ reward
 */
const http = require('http');
const fs = require('fs');

const CONFIG = {
  port: process.env.QA_PORT || 3001,
  gatewayUrl: process.env.GATEWAY_URL || 'https://api.myzubster.com',
  rewardNormal: 5,
  rewardCritical: 20,
  reportsFile: './qa-reports.json'
};

// Initialize reports storage
let reports = [];
try { reports = JSON.parse(fs.readFileSync(CONFIG.reportsFile, 'utf8')); } catch(e) { reports = []; }

function saveReports() {
  fs.writeFileSync(CONFIG.reportsFile, JSON.stringify(reports, null, 2));
}

function log(level, msg, data = {}) {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [${level}] ${msg}`, JSON.stringify(data));
}

// Mint reward via Gateway
function mintReward(wallet, amount, reason) {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ wallet, amount, reason, token: 'MYZ' });
    const url = new URL('/mint', CONFIG.gatewayUrl);
    const req = http.request({
      hostname: url.hostname, port: url.port || 443, path: url.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        resolve({ success: res.statusCode === 200, body });
      });
    });
    req.on('error', (e) => resolve({ success: false, error: e.message }));
    req.write(payload); req.end();
  });
}

// Simple HTML form
const FORM_HTML = `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MyZubster QA - Segnala Bug</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:#0a0a1a; color:#e0e0e0; font-family:system-ui,sans-serif; min-height:100vh; display:flex; justify-content:center; align-items:center; }
.form-container { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; padding:40px; max-width:500px; width:90%; }
h1 { font-size:1.5rem; background:linear-gradient(135deg,#f9d423,#ff4e50); -webkit-background-clip:text; -webkit-text-fill-color:transparent; margin-bottom:8px; }
.subtitle { color:#888; font-size:0.9rem; margin-bottom:25px; }
.form-group { margin-bottom:18px; }
label { display:block; margin-bottom:6px; color:#aaa; font-size:0.9rem; }
input, select, textarea { width:100%; padding:10px 12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.15); border-radius:8px; color:#e0e0e0; font-size:0.95rem; }
textarea { resize:vertical; min-height:100px; }
select { cursor:pointer; }
select option { background:#1a1a2e; color:#e0e0e0; }
button { width:100%; padding:12px; background:linear-gradient(135deg,#f9d423,#ff4e50); border:none; border-radius:8px; color:#0a0a1a; font-weight:bold; font-size:1rem; cursor:pointer; margin-top:10px; transition:opacity 0.2s; }
button:hover { opacity:0.9; }
.success { background:rgba(76,175,80,0.2); border:1px solid #4caf50; border-radius:8px; padding:15px; margin-top:15px; display:none; }
.success.show { display:block; }
.reward-info { color:#f9d423; font-weight:bold; }
.stats-mini { display:flex; gap:15px; margin-bottom:20px; }
.stat-mini { flex:1; background:rgba(255,255,255,0.03); border-radius:8px; padding:12px; text-align:center; }
.stat-mini .val { font-size:1.3rem; font-weight:bold; background:linear-gradient(135deg,#f9d423,#ff4e50); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
.stat-mini .lbl { font-size:0.75rem; color:#666; margin-top:3px; }
</style>
</head>
<body>
<div class="form-container">
  <h1>🐛 Segnala un Bug</h1>
  <p class="subtitle">Ricevi <span class="reward-info">5-20 MYZ</span> per ogni bug valido</p>

  <div class="stats-mini">
    <div class="stat-mini"><div class="val" id="total-reports">0</div><div class="lbl">Report Totali</div></div>
    <div class="stat-mini"><div class="val" id="valid-reports">0</div><div class="lbl">Validati</div></div>
    <div class="stat-mini"><div class="val" id="total-rewarded">0</div><div class="lbl">MYZ Erogati</div></div>
  </div>

  <form id="bug-form">
    <div class="form-group">
      <label>Titolo del Bug *</label>
      <input type="text" id="title" placeholder="Es: Crash all\'avvio su Safari" required>
    </div>
    <div class="form-group">
      <label>Gravità *</label>
      <select id="severity" required>
        <option value="normal">🟡 Normale (5 MYZ)</option>
        <option value="critical">🔴 Critico (20 MYZ)</option>
      </select>
    </div>
    <div class="form-group">
      <label>Descrizione *</label>
      <textarea id="description" placeholder="Descrivi il bug: come riprodurlo, cosa ti aspettavi, cosa è successo..." required></textarea>
    </div>
    <div class="form-group">
      <label>Wallet MYZ</label>
      <input type="text" id="wallet" placeholder="Il tuo indirizzo wallet Tari">
    </div>
    <button type="submit">📤 Invia Segnalazione</button>
  </form>
  <div class="success" id="success-msg"></div>
</div>

<script>
document.getElementById('bug-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = {
    title: document.getElementById('title').value,
    severity: document.getElementById('severity').value,
    description: document.getElementById('description').value,
    wallet: document.getElementById('wallet').value
  };
  try {
    const resp = await fetch('/api/report', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data)
    });
    const result = await resp.json();
    if (result.success) {
      document.getElementById('success-msg').innerHTML =
        '\u2705 Segnalazione inviata! ID: ' + result.id +
        '\u003cbr\u003eRiceverai ' + (data.severity==='critical'?20:5) +
        ' MYZ dopo la validazione.';
      document.getElementById('success-msg').classList.add('show');
      document.getElementById('bug-form').reset();
    }
  } catch(err) {
    alert('Errore: ' + err.message);
  }
});
// Load stats
fetch('/api/stats').then(r=>r.json()).then(s=>{
  document.getElementById('total-reports').textContent = s.total;
  document.getElementById('valid-reports').textContent = s.valid;
  document.getElementById('total-rewarded').textContent = s.rewarded;
});
</script>
</body>
</html>`;

// API handler
async function handleReport(data) {
  const report = {
    id: 'QA-' + Date.now().toString(36).toUpperCase(),
    ...data,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    reviewedBy: null,
    reviewedAt: null
  };
  reports.push(report);
  saveReports();
  log('INFO', 'New bug report', { id: report.id, severity: data.severity });
  return { success: true, id: report.id, reward: data.severity === 'critical' ? 20 : 5 };
}

function handleValidate(reportId, reviewer, valid) {
  const report = reports.find(r => r.id === reportId);
  if (!report) return { success: false, error: 'Report not found' };
  report.status = valid ? 'valid' : 'rejected';
  report.reviewedBy = reviewer;
  report.reviewedAt = new Date().toISOString();
  saveReports();
  if (valid && report.wallet) {
    const amount = report.severity === 'critical' ? CONFIG.rewardCritical : CONFIG.rewardNormal;
    mintReward(report.wallet, amount, `QA bug report ${report.id}`).then(r => {
      log(r.success ? 'SUCCESS' : 'ERROR', `Reward ${amount} MYZ for ${report.id}`, r);
    });
  }
  return { success: true, status: report.status };
}

function getStats() {
  return {
    total: reports.length,
    valid: reports.filter(r => r.status === 'valid').length,
    pending: reports.filter(r => r.status === 'pending').length,
    rejected: reports.filter(r => r.status === 'rejected').length,
    rewarded: reports.filter(r => r.status === 'valid').reduce((sum, r) =>
      sum + (r.severity === 'critical' ? CONFIG.rewardCritical : CONFIG.rewardNormal), 0)
  };
}

// Server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // Serve HTML form
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(FORM_HTML);
    return;
  }

  // API: Submit report
  if (req.method === 'POST' && req.url === '/api/report') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const result = await handleReport(data);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // API: Validate report (maintainer only)
  if (req.method === 'POST' && req.url === '/api/validate') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const { id, reviewer, valid } = JSON.parse(body);
        const result = handleValidate(id, reviewer, valid);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch(e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // API: Stats
  if (req.method === 'GET' && req.url === '/api/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getStats()));
    return;
  }

  // API: List reports
  if (req.method === 'GET' && req.url === '/api/reports') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(reports.slice(-50)));
    return;
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(CONFIG.port, () => {
  log('INFO', `QA Reward System started on port ${CONFIG.port}`);
});

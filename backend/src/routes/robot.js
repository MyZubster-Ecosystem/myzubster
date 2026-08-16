const express = require('express');
const mongoose = require('mongoose');
const { RobotService, PoppyErgoJrDriver, SimulatedRobot } = require('../robot');
const RobotTelemetry = require('../models/RobotTelemetry');

const router = express.Router();

// Build the default registry: the Eva Ioni simulation is always available;
// the real Poppy Ergo Jr driver is registered only when configured.
const service = new RobotService();
service.register(new SimulatedRobot({ name: 'eva-ioni' }));
if (process.env.POPPY_ENABLE === 'true' || process.env.POPPY_HOST) {
  service.register(
    new PoppyErgoJrDriver({
      name: 'poppy-ergo-jr',
      host: process.env.POPPY_HOST || 'localhost',
      port: process.env.POPPY_PORT || 6969,
    })
  );
}

async function persistTelemetry(sample) {
  // Persist only when MongoDB is connected; otherwise skip gracefully so the
  // API still works in development / offline scenarios.
  try {
    if (mongoose.connection.readyState === 1) {
      await RobotTelemetry.create({
        robot: sample.robot,
        source: sample.source,
        timestamp: sample.timestamp ? new Date(sample.timestamp) : new Date(),
        motors: sample.motors || {},
        meta: sample.meta || {},
      });
    }
  } catch (e) {
    console.error('RobotTelemetry persist error:', e.message);
  }
}

// GET /api/robot/status — list every registered robot
router.get('/status', async (_req, res) => {
  try {
    const robots = service.list().map((r) => ({
      name: r.name,
      kind: r.kind,
      model: r.model,
      source: r.source,
      connected: r.connected,
    }));
    res.json({ success: true, robots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/robot/status/:name — detailed status of one robot
router.get('/status/:name', async (req, res) => {
  try {
    const status = await service.status(req.params.name);
    res.json({ success: true, status });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

// GET /api/robot/telemetry?robot=name — telemetry for one or all robots
router.get('/telemetry', async (req, res) => {
  try {
    const robots = req.query.robot ? [req.query.robot] : service.list().map((r) => r.name);
    const samples = {};
    for (const name of robots) {
      const sample = await service.telemetry(name);
      await persistTelemetry(sample);
      samples[name] = sample;
    }
    res.json({ success: true, telemetry: samples });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

// GET /api/robot/telemetry/:name — telemetry for a single robot
router.get('/telemetry/:name', async (req, res) => {
  try {
    const sample = await service.telemetry(req.params.name);
    await persistTelemetry(sample);
    res.json({ success: true, telemetry: sample });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

// GET /api/robot/history/:name?limit= — recent telemetry samples
router.get('/history/:name', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 20;
  const samples = service.history(req.params.name, limit);
  res.json({ success: true, robot: req.params.name, count: samples.length, samples });
});

// POST /api/robot/command — body: { robot, command, params }
router.post('/command', async (req, res) => {
  try {
    const { robot, command, params } = req.body || {};
    if (!robot || !command) {
      return res.status(400).json({ success: false, error: 'robot and command are required' });
    }
    const result = await service.command(robot, command, params || {});
    if (result && result.telemetry) await persistTelemetry(result.telemetry);
    res.json({ success: true, result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
});

// GET /api/robot/dashboard — self-contained HTML dashboard (Poppy in the UI)
router.get('/dashboard', (_req, res) => {
  res.type('html').send(renderDashboard());
});

function renderDashboard() {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    '  <title>Robot Dashboard — Space Station</title>',
    '  <style>',
    '    body { font-family: system-ui, sans-serif; max-width: 960px; margin: 32px auto; padding: 0 16px; background: #0f1115; color: #e6e8ec; }',
    '    h1 { font-size: 1.4rem; }',
    '    .card { background: #1a1d24; border: 1px solid #2a2e39; border-radius: 12px; padding: 16px; margin: 14px 0; }',
    '    .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; }',
    '    .real { background: #123524; color: #4ade80; }',
    '    .simulated { background: #1e2a3a; color: #60a5fa; }',
    '    .offline { background: #3a1515; color: #f87171; }',
    '    table { width: 100%; border-collapse: collapse; }',
    '    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #2a2e39; font-size: 0.85rem; }',
    '    code { background: #252a35; padding: 2px 6px; border-radius: 5px; }',
    '    button { background: #3b82f6; color: white; border: 0; padding: 8px 14px; border-radius: 8px; cursor: pointer; }',
    '  </style>',
    '</head>',
    '<body>',
    '  <h1>Robot Dashboard</h1>',
    '  <div class="card" id="status">Loading status...</div>',
    '  <div class="card" id="telemetry">Loading telemetry...</div>',
    '  <div class="card">',
    '    <button id="wave">Send move_to (m1=45, m2=30)</button>',
    '    <span id="cmd-result"></span>',
    '  </div>',
    '  <script>',
    '    function badge(source, connected) {',
    '      if (!connected) return "<span class=\\"badge offline\\">offline</span>";',
    '      if (source === "poppy") return "<span class=\\"badge real\\">real (Poppy)</span>";',
    '      return "<span class=\\"badge simulated\\">simulated (Eva Ioni)</span>";',
    '    }',
    '    async function loadStatus() {',
    '      var r = await fetch("/api/robot/status");',
    '      var j = await r.json();',
    '      var html = "<strong>Robots</strong><ul>";',
    '      j.robots.forEach(function (b) {',
    '        html += "<li>" + b.name + " &mdash; " + b.model + " " + badge(b.source, b.connected) + "</li>";',
    '      });',
    '      html += "</ul>";',
    '      document.getElementById("status").innerHTML = html;',
    '    }',
    '    async function loadTelemetry() {',
    '      var r = await fetch("/api/robot/telemetry");',
    '      var j = await r.json();',
    '      var html = "<strong>Telemetry</strong>";',
    '      Object.keys(j.telemetry).forEach(function (name) {',
    '        var t = j.telemetry[name];',
    '        html += "<p>" + name + " (" + t.source + ") @ " + t.timestamp + "</p><table><tr><th>Motor</th><th>Position</th><th>Load</th><th>Temp</th></tr>";',
    '        Object.keys(t.motors).forEach(function (m) {',
    '          var d = t.motors[m];',
    '          html += "<tr><td>" + m + "</td><td>" + (d.present_position !== undefined ? d.present_position : "-") + "</td><td>" + (d.present_load !== undefined ? d.present_load : "-") + "</td><td>" + (d.present_temperature !== undefined ? d.present_temperature : "-") + "</td></tr>";',
    '        });',
    '        html += "</table>";',
    '      });',
    '      document.getElementById("telemetry").innerHTML = html;',
    '    }',
    '    document.getElementById("wave").onclick = async function () {',
    '      var r = await fetch("/api/robot/command", {',
    '        method: "POST",',
    '        headers: { "Content-Type": "application/json" },',
    '        body: JSON.stringify({ robot: "eva-ioni", command: "move_to", params: { motors: { m1: 45, m2: 30 } } })',
    '      });',
    '      var j = await r.json();',
    '      document.getElementById("cmd-result").textContent = j.success ? "accepted" : (j.error || "error");',
    '      loadTelemetry();',
    '    };',
    '    loadStatus();',
    '    loadTelemetry();',
    '  </script>',
    '</body>',
    '</html>',
  ].join('\n');
}

module.exports = router;
module.exports.service = service;

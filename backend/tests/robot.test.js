/**
 * Test Suite: Robot integration (Bounty #402 — Poppy Ergo Jr)
 *
 * Covers the RobotService abstraction, the simulated vs real telemetry
 * distinction, and the /api/robot endpoints (status, telemetry, command,
 * dashboard). The real Poppy driver is exercised with a mocked HTTP layer
 * so no physical hardware is required.
 */

const request = require('supertest');
const express = require('express');

const robotRoutes = require('../src/routes/robot');
const { RobotService, SimulatedRobot, PoppyErgoJrDriver } = require('../src/robot');

let app;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use('/api/robot', robotRoutes);
});

describe('GET /api/robot/status', () => {
  test('lists the simulated Eva Ioni robot', async () => {
    const res = await request(app).get('/api/robot/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const names = res.body.robots.map((r) => r.name);
    expect(names).toContain('eva-ioni');
  }, 10000);

  test('flags the source and kind (simulated vs real)', async () => {
    const res = await request(app).get('/api/robot/status');
    const eva = res.body.robots.find((r) => r.name === 'eva-ioni');
    expect(eva.kind).toBe('simulated');
    expect(eva.source).toBe('eva-ioni-simulated');
  }, 10000);

  test('returns detailed status for a known robot', async () => {
    const res = await request(app).get('/api/robot/status/eva-ioni');
    expect(res.status).toBe(200);
    expect(res.body.status.name).toBe('eva-ioni');
    expect(res.body.status.connected).toBe(true);
  }, 10000);
});

describe('GET /api/robot/telemetry', () => {
  test('returns simulated telemetry tagged with source', async () => {
    const res = await request(app).get('/api/robot/telemetry/eva-ioni');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.telemetry.source).toBe('eva-ioni-simulated');
    expect(res.body.telemetry.motors).toBeDefined();
    expect(res.body.telemetry.timestamp).toBeDefined();
  }, 10000);

  test('returns telemetry for all robots via query-less endpoint', async () => {
    const res = await request(app).get('/api/robot/telemetry');
    expect(res.status).toBe(200);
    expect(res.body.telemetry['eva-ioni']).toBeDefined();
  }, 10000);

  test('404 for unknown robot', async () => {
    const res = await request(app).get('/api/robot/telemetry/unknown-bot');
    expect(res.status).toBe(404);
  }, 10000);
});

describe('POST /api/robot/command', () => {
  test('executes move_to on the simulated robot', async () => {
    const res = await request(app)
      .post('/api/robot/command')
      .send({ robot: 'eva-ioni', command: 'move_to', params: { motors: { m1: 10, m2: 20 } } });
    expect(res.status).toBe(200);
    expect(res.body.result.accepted).toBe(true);
    expect(res.body.result.telemetry.source).toBe('eva-ioni-simulated');
  }, 10000);

  test('400 when robot or command is missing', async () => {
    const res = await request(app).post('/api/robot/command').send({});
    expect(res.status).toBe(400);
  }, 10000);

  test('404 for unknown robot', async () => {
    const res = await request(app)
      .post('/api/robot/command')
      .send({ robot: 'nope', command: 'move_to', params: {} });
    expect(res.status).toBe(404);
  }, 10000);

  test('400 for unsupported command', async () => {
    const res = await request(app)
      .post('/api/robot/command')
      .send({ robot: 'eva-ioni', command: 'do_a_flip', params: {} });
    expect(res.status).toBe(400);
  }, 10000);
});

describe('GET /api/robot/dashboard', () => {
  test('serves the HTML dashboard', async () => {
    const res = await request(app).get('/api/robot/dashboard');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Robot Dashboard');
  }, 10000);
});

describe('RobotService abstraction', () => {
  test('distinguishes simulated vs real drivers by source', async () => {
    const svc = new RobotService();
    svc.register(new SimulatedRobot({ name: 'sim' }));
    const telemetry = await svc.telemetry('sim');
    expect(telemetry.source).toBe('eva-ioni-simulated');
    const status = await svc.status('sim');
    expect(status.kind).toBe('simulated');
  }, 10000);

  test('throws 404 for unknown robot', async () => {
    const svc = new RobotService();
    await expect(svc.telemetry('ghost')).rejects.toMatchObject({ statusCode: 404 });
  }, 10000);
});

describe('PoppyErgoJrDriver (mocked HTTP)', () => {
  test('parses motor list and reports real (poppy) telemetry', async () => {
    const poppy = new PoppyErgoJrDriver({ name: 'poppy' });
    poppy._request = jest.fn(async (method, path) => {
      if (path === '/motors/list.json') return ['m1', 'm2', 'm3'];
      if (path.indexOf('present_position') !== -1) return { present_position: 42 };
      return {};
    });
    await poppy.connect();
    expect(poppy.connected).toBe(true);
    expect(poppy.motors).toEqual(['m1', 'm2', 'm3']);

    const telemetry = await poppy.getTelemetry();
    expect(telemetry.source).toBe('poppy');
    expect(telemetry.motors.m1.present_position).toBe(42);
  }, 10000);

  test('executes move_to via the pypot goto endpoint', async () => {
    const poppy = new PoppyErgoJrDriver({ name: 'poppy' });
    const calls = [];
    poppy._request = jest.fn(async (method, path, body) => {
      calls.push({ method, path, body });
      if (path === '/motors/list.json') return ['m1', 'm2'];
      return { present_position: 0 };
    });
    const result = await poppy.executeCommand('move_to', { motors: { m1: 90, m2: -90 }, duration: 1500 });
    expect(result.accepted).toBe(true);
    const gotoCall = calls.find((c) => c.path === '/motors/goto.json');
    expect(gotoCall).toBeDefined();
    expect(gotoCall.method).toBe('POST');
    expect(gotoCall.body.m1).toBe(90);
  }, 10000);
});

/**
 * PoppyErgoJrDriver — connects to a real Poppy Ergo Jr arm running pypot.
 *
 * pypot (the Poppy Project middleware) exposes a REST API, by default at
 * http://<host>:6969. This driver implements the subset used by the Space
 * Station:
 *   GET  /motors/list.json                           -> motor names
 *   GET  /motors/<motor>/registers/<reg>/value.json  -> read a register
 *   POST /motors/<motor>/registers/<reg>/value.json  -> write a register
 *   POST /motors/goto.json                           -> move several motors
 *
 * Telemetry is read by polling motor registers (present_position,
 * present_load, present_temperature). For higher-frequency streaming the same
 * polling loop can be swapped for a WebSocket/zmq subscriber without changing
 * the RobotService contract — see docs/poppy-ergo-jr-setup.md.
 */

const http = require('http');

class PoppyErgoJrDriver {
  constructor({ name = 'poppy-ergo-jr', host = 'localhost', port = 6969 } = {}) {
    this.name = name;
    this.host = host;
    this.port = Number(port) || 6969;
    this.connected = false;
    this.motors = [];
  }

  describe() {
    return {
      name: this.name,
      kind: 'real',
      model: 'Poppy Ergo Jr',
      source: 'poppy', // distinguishes real hardware from simulation
      host: this.host,
      port: this.port,
      connected: this.connected,
      motors: this.motors.slice(),
    };
  }

  _request(method, path, body) {
    return new Promise((resolve, reject) => {
      const payload = body === undefined ? null : Buffer.from(JSON.stringify(body));
      const options = {
        host: this.host,
        port: this.port,
        method,
        path,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      };
      if (payload) options.headers['Content-Length'] = payload.length;

      const req = http.request(options, (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          let parsed = null;
          try { parsed = raw ? JSON.parse(raw) : null; } catch (e) { parsed = raw; }
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            const err = new Error(
              'pypot ' + method + ' ' + path + ' -> HTTP ' + res.statusCode + ': ' + raw.slice(0, 200)
            );
            err.statusCode = res.statusCode;
            reject(err);
          }
        });
      });
      req.on('error', reject);
      req.setTimeout(5000, () => { req.destroy(new Error('pypot request timed out')); });
      if (payload) req.write(payload);
      req.end();
    });
  }

  async connect() {
    const motors = await this._request('GET', '/motors/list.json');
    this.motors = Array.isArray(motors) ? motors : (motors && motors.motors) || [];
    this.connected = true;
    return this.describe();
  }

  async disconnect() {
    this.connected = false;
    return this.describe();
  }

  async getStatus() {
    if (!this.connected) {
      try {
        await this.connect();
      } catch (e) {
        return Object.assign(this.describe(), { connected: false, error: e.message });
      }
    }
    const motors = this.motors.length ? this.motors : ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
    const states = {};
    for (const m of motors) {
      try {
        const pos = await this._request(
          'GET', '/motors/' + encodeURIComponent(m) + '/registers/present_position/value.json'
        );
        states[m] = {
          present_position: pos && pos.present_position !== undefined ? pos.present_position : pos,
        };
      } catch (e) {
        states[m] = { error: e.message };
      }
    }
    return Object.assign(this.describe(), { connected: true, motor_states: states });
  }

  async executeCommand(command, params = {}) {
    if (!this.connected) await this.connect();
    if (command === 'move_to' || command === 'goto') {
      const goto = params.motors || params.positions || params;
      const duration = params.duration || 2000;
      const body = Object.assign({}, goto);
      if (params.duration !== undefined) body.duration = duration;
      await this._request('POST', '/motors/goto.json', body);
      return {
        command,
        accepted: true,
        positions: goto,
        duration,
        telemetry: await this.getTelemetry(),
      };
    }
    if (command === 'set_register') {
      const motor = params.motor;
      const register = params.register;
      const value = params.value;
      await this._request(
        'POST',
        '/motors/' + encodeURIComponent(motor) + '/registers/' + encodeURIComponent(register) + '/value.json',
        value
      );
      return { command, accepted: true, motor, register, value, telemetry: await this.getTelemetry() };
    }
    const err = new Error('Unsupported command: ' + command);
    err.statusCode = 400;
    throw err;
  }

  async getTelemetry() {
    if (!this.connected) await this.connect();
    const motors = this.motors.length ? this.motors : ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
    const motorData = {};
    for (const m of motors) {
      try {
        const pos = await this._request(
          'GET', '/motors/' + encodeURIComponent(m) + '/registers/present_position/value.json'
        );
        motorData[m] = {
          present_position: pos && pos.present_position !== undefined ? pos.present_position : pos,
        };
      } catch (e) {
        motorData[m] = { error: e.message };
      }
    }
    return {
      source: 'poppy', // real hardware telemetry
      robot: this.name,
      timestamp: new Date().toISOString(),
      motors: motorData,
    };
  }
}

module.exports = PoppyErgoJrDriver;

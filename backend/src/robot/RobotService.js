/**
 * RobotService — hardware device abstraction layer.
 *
 * Registers robot drivers (real hardware or simulated) behind a single
 * uniform interface: status, command, telemetry. This lets the Space Station
 * talk to a physical Poppy Ergo Jr arm or the simulated Eva Ioni robot
 * without any caller code changing.
 */
class RobotService {
  constructor() {
    this.robots = new Map();
    this.telemetryHistory = new Map(); // robot name -> ring buffer of samples
    this.MAX_HISTORY = 100;
  }

  register(robot) {
    if (!robot || typeof robot !== 'object') {
      throw new Error('RobotService.register expects a robot instance');
    }
    const name = robot.name;
    if (!name) throw new Error('Robot must declare a name');
    this.robots.set(name, robot);
    if (!this.telemetryHistory.has(name)) {
      this.telemetryHistory.set(name, []);
    }
    return robot;
  }

  unregister(name) {
    this.robots.delete(name);
    this.telemetryHistory.delete(name);
  }

  get(name) {
    return this.robots.get(name);
  }

  has(name) {
    return this.robots.has(name);
  }

  list() {
    return Array.from(this.robots.values()).map((robot) => robot.describe());
  }

  _pushHistory(name, sample) {
    const buffer = this.telemetryHistory.get(name) || [];
    buffer.push(sample);
    while (buffer.length > this.MAX_HISTORY) buffer.shift();
    this.telemetryHistory.set(name, buffer);
  }

  async status(name) {
    const robot = this._require(name);
    return robot.getStatus();
  }

  async command(name, command, params) {
    const robot = this._require(name);
    const result = await robot.executeCommand(command, params);
    if (result && result.telemetry) {
      this._pushHistory(name, result.telemetry);
    }
    return result;
  }

  async telemetry(name) {
    const robot = this._require(name);
    const sample = await robot.getTelemetry();
    this._pushHistory(name, sample);
    return sample;
  }

  history(name, limit) {
    const buffer = this.telemetryHistory.get(name) || [];
    const n = limit && limit > 0 ? Math.min(limit, buffer.length) : buffer.length;
    return buffer.slice(buffer.length - n);
  }

  _require(name) {
    const robot = this.robots.get(name);
    if (!robot) {
      const err = new Error('Unknown robot: ' + name);
      err.statusCode = 404;
      throw err;
    }
    return robot;
  }
}

module.exports = RobotService;

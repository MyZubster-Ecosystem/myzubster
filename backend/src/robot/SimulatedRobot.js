/**
 * SimulatedRobot — deterministic Eva Ioni simulation.
 *
 * Generates plausible telemetry without requiring physical hardware so the
 * Space Station can be developed and tested offline. Telemetry is tagged
 * source: 'eva-ioni-simulated' so consumers can distinguish it from real
 * Poppy data.
 */
class SimulatedRobot {
  constructor({ name = 'eva-ioni', seed = 42 } = {}) {
    this.name = name;
    this.seed = seed;
    this.connected = true;
    this.motors = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'];
    this.position = 0;
  }

  describe() {
    return {
      name: this.name,
      kind: 'simulated',
      model: 'Eva Ioni (simulator)',
      source: 'eva-ioni-simulated',
      connected: this.connected,
      motors: this.motors.slice(),
      seed: this.seed,
    };
  }

  _pseudo(i) {
    // deterministic pseudo-random in [0, 1) from seed + step
    const x = Math.sin(this.seed + this.position + i * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  }

  async getStatus() {
    return Object.assign(this.describe(), {
      connected: true,
      mode: 'simulated',
      uptime_ms: Math.round(process.uptime() * 1000),
    });
  }

  async executeCommand(command, params = {}) {
    if (command === 'move_to' || command === 'goto') {
      const positions = params.motors || params.positions || {};
      this.position += 1;
      return {
        command,
        accepted: true,
        positions,
        duration: params.duration || 2000,
        telemetry: await this.getTelemetry(),
      };
    }
    if (command === 'set_register') {
      this.position += 1;
      return {
        command,
        accepted: true,
        motor: params.motor,
        register: params.register,
        value: params.value,
        telemetry: await this.getTelemetry(),
      };
    }
    const err = new Error('Unsupported command: ' + command);
    err.statusCode = 400;
    throw err;
  }

  async getTelemetry() {
    const motorData = {};
    this.motors.forEach((m, i) => {
      motorData[m] = {
        present_position: Math.round(this._pseudo(i) * 180 - 90),
        present_load: Math.round(this._pseudo(i + 10) * 100),
        present_temperature: Math.round(25 + this._pseudo(i + 20) * 10),
      };
    });
    this.position += 1;
    return {
      source: 'eva-ioni-simulated', // simulated telemetry
      robot: this.name,
      timestamp: new Date().toISOString(),
      motors: motorData,
    };
  }
}

module.exports = SimulatedRobot;

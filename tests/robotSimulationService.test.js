const {
  ROBOTS,
  createFleetPulse,
  containsPhysicalCommand,
  validateExternalSimulationTelemetry
} = require('../src/services/robotSimulationService');

describe('robot simulation runtime', () => {
  test('publishes both robots as simulation active with actuators disabled', () => {
    const pulse = createFleetPulse({ now: new Date('2026-08-31T06:30:00.000Z'), source: 'test' });
    expect(pulse.state).toBe('SIMULATION_ACTIVE');
    expect(pulse.robots.map(robot => robot.robot_id)).toEqual(ROBOTS.map(robot => robot.id));
    for (const robot of pulse.robots) {
      expect(robot.telemetry.synthetic).toBe(true);
      expect(robot.safety.actuators_enabled).toBe(false);
      expect(robot.safety.physical_hardware_verified).toBe(false);
      expect(robot.safety.autonomous_settlement_enabled).toBe(false);
    }
  });

  test('rejects physical command fields from simulation telemetry', () => {
    expect(containsPhysicalCommand({ motor_speed: 10 })).toBe(true);
    const result = validateExternalSimulationTelemetry({
      robot_id: 'EVA-IONI',
      mode: 'simulation',
      telemetry: { temperature_c: 22 },
      pump: true
    });
    expect(result.ok).toBe(false);
  });

  test('accepts bounded telemetry for a known robot', () => {
    const result = validateExternalSimulationTelemetry({
      robot_id: 'MYZUBSTER-ROBOT',
      mode: 'simulation',
      telemetry: { temperature_c: 21.5, soil_moisture_pct: 48 }
    });
    expect(result.ok).toBe(true);
    expect(result.robot.id).toBe('MYZUBSTER-ROBOT');
  });
});

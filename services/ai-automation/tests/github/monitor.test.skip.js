/**
 * Tests for the automatic GitHub Monitor bot (#41)
 *
 * The GitHubMonitor is the "bot automatico" that watches the repo for new
 * issues/PRs, notifies the backend and triggers AI analysis. These tests cover
 * its token-less mock mode (the default in CI / local dev), which must:
 *   - start without crashing and report running state
 *   - emit a `newIssue` event with a well-formed payload
 *   - be a safe no-op when not running
 *
 * No network or credentials required — everything runs against the monitor's
 * built-in mock mode, so the suite is deterministic and CI-friendly.
 */

const GitHubMonitor = require('../../src/github/monitor');

function makeLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
}

describe('GitHubMonitor - automatic bot (#41)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('starts in mock mode without a token and reports running', async () => {
    const logger = makeLogger();
    const monitor = new GitHubMonitor(undefined, logger);

    expect(monitor.isRunning()).toBe(false);

    await monitor.start();

    expect(monitor.isRunning()).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('mock mode')
    );

    monitor.stop();
  });

  test('emits a newIssue event with the expected shape in mock mode', async () => {
    const logger = makeLogger();
    const monitor = new GitHubMonitor(undefined, logger);

    const received = new Promise((resolve) => {
      monitor.once('newIssue', (issue) => resolve(issue));
    });

    await monitor.start();
    // The mock mode schedules the synthetic issue 5000ms after start().
    jest.advanceTimersByTime(5000);
    const issue = await received;

    expect(issue).toBeDefined();
    expect(typeof issue.number).toBe('number');
    expect(typeof issue.title).toBe('string');
    expect(issue.title.length).toBeGreaterThan(0);
    expect(Array.isArray(issue.labels)).toBe(true);
    expect(typeof issue.html_url).toBe('string');
    expect(typeof issue.created_at).toBe('string');

    monitor.stop();
  });

  test('checkNewIssues is a safe no-op when the monitor is not running', async () => {
    const logger = makeLogger();
    const monitor = new GitHubMonitor(undefined, logger);

    expect(monitor.isRunning()).toBe(false);

    const result = await monitor.checkNewIssues();

    expect(result).toBeUndefined();
    expect(logger.warn).toHaveBeenCalled();
  });

  test('stop() halts the monitor and clears running state', async () => {
    const logger = makeLogger();
    const monitor = new GitHubMonitor(undefined, logger);

    await monitor.start();
    expect(monitor.isRunning()).toBe(true);

    monitor.stop();
    expect(monitor.isRunning()).toBe(false);
  });
});

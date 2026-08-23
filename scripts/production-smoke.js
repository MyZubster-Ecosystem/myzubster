#!/usr/bin/env node

const baseUrl = (process.env.SMOKE_BASE_URL || 'https://myzubster.com').replace(/\/$/, '');
const configuredPaths = process.env.SMOKE_PATHS
  ? process.env.SMOKE_PATHS.split(',').map((value) => value.trim()).filter(Boolean)
  : ['/', '/health', '/api/dashboard'];

const timeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 15000);

async function check(path) {
  const url = new URL(path, `${baseUrl}/`).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'user-agent': 'MyZubster-Operational-Smoke/1.0',
        accept: 'application/json,text/html;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });

    const durationMs = Date.now() - started;
    const contentType = response.headers.get('content-type') || '';
    const body = await response.text();

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    if (path === '/health' && contentType.includes('application/json')) {
      const parsed = JSON.parse(body);
      if (parsed.status !== 'ok' || parsed.success !== true) {
        throw new Error('health payload does not report success=true and status=ok');
      }
    }

    if (path === '/api/dashboard' && contentType.includes('application/json')) {
      const parsed = JSON.parse(body);
      if (parsed.success !== true || !parsed.services) {
        throw new Error('dashboard payload is missing success=true or services');
      }
    }

    console.log(`PASS ${response.status} ${durationMs}ms ${url}`);
    return { path, ok: true, status: response.status, durationMs };
  } catch (error) {
    const durationMs = Date.now() - started;
    console.error(`FAIL ${durationMs}ms ${url}: ${error.message}`);
    return { path, ok: false, error: error.message, durationMs };
  } finally {
    clearTimeout(timeout);
  }
}

(async () => {
  console.log(`MyZubster production smoke: ${baseUrl}`);
  console.log(`Paths: ${configuredPaths.join(', ')}`);

  const results = [];
  for (const path of configuredPaths) {
    results.push(await check(path));
  }

  const failed = results.filter((result) => !result.ok);
  console.log(`Summary: ${results.length - failed.length}/${results.length} checks passed`);

  if (failed.length > 0) {
    process.exitCode = 1;
  }
})();

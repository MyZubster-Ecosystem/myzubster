#!/usr/bin/env python3
# Eva Ioni telemetry simulator for the MyZubster Space Station MVP.
#
# Generates realistic Eva Ioni robot telemetry and periodically submits it
# to the Space Station telemetry API (POST /api/telemetry).
#
# Configuration is done exclusively through environment variables so the
# endpoint and interval can be changed without editing source code:
#   TELEMETRY_API_URL          target endpoint (default http://localhost:3009/api/telemetry)
#   TELEMETRY_UPDATE_INTERVAL  seconds between submissions (default 5)
#   ROBOT_ID                   robot identifier (default eva-ioni-001)
#   TELEMETRY_MAX_RETRIES      max retries per failed submission (default 5)
#   TELEMETRY_RETRY_BACKOFF    initial backoff seconds, doubles each retry (default 2)
#   TELEMETRY_ONCE             submit a single sample then exit (default false)

import json
import os
import random
import time
import urllib.error
import urllib.request

DEFAULT_API_URL = 'http://localhost:3009/api/telemetry'
DEFAULT_INTERVAL = 5.0
DEFAULT_ROBOT_ID = 'eva-ioni-001'
ROBOT_STATUSES = ['idle', 'exploring', 'charging', 'docked']


def env_float(name, default):
    value = os.environ.get(name)
    try:
        return float(value) if value else default
    except (TypeError, ValueError):
        return default


def env_bool(name, default=False):
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in ('1', 'true', 'yes', 'on')


def generate_telemetry(robot_id):
    now = time.time()
    return {
        'robotId': robot_id,
        'temperature': round(random.uniform(18.0, 32.0), 2),
        'humidity': round(random.uniform(30.0, 80.0), 2),
        'battery': round(random.uniform(20.0, 100.0), 2),
        'cpuTemperature': round(random.uniform(35.0, 72.0), 2),
        'signalStrength': random.randint(-90, -40),
        'status': random.choice(ROBOT_STATUSES),
        'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(now)),
        'source': 'simulator',
    }


def submit_telemetry(api_url, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        api_url,
        data=data,
        method='POST',
        headers={'Content-Type': 'application/json', 'User-Agent': 'eva-ioni-simulator/1.0'},
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        body = resp.read().decode('utf-8', 'replace')
        return resp.status, body


def run():
    api_url = os.environ.get('TELEMETRY_API_URL', DEFAULT_API_URL)
    interval = env_float('TELEMETRY_UPDATE_INTERVAL', DEFAULT_INTERVAL)
    robot_id = os.environ.get('ROBOT_ID', DEFAULT_ROBOT_ID)
    max_retries = int(env_float('TELEMETRY_MAX_RETRIES', 5))
    backoff = env_float('TELEMETRY_RETRY_BACKOFF', 2.0)
    once = env_bool('TELEMETRY_ONCE', False)

    print('[eva-ioni] starting simulator robot=%s endpoint=%s interval=%.1fs' % (
        robot_id, api_url, interval))

    while True:
        payload = generate_telemetry(robot_id)
        delivered = False
        attempt = 0
        delay = backoff
        while not delivered and attempt <= max_retries:
            attempt += 1
            try:
                status, _body = submit_telemetry(api_url, payload)
                print('[eva-ioni] submitted temp=%.1fC hum=%.0f%% batt=%.0f%% status=%s -> HTTP %s' % (
                    payload['temperature'], payload['humidity'],
                    payload['battery'], payload['status'], status))
                delivered = True
            except urllib.error.HTTPError as err:
                print('[eva-ioni] HTTP error %s (attempt %d/%d): %s' % (
                    err.code, attempt, max_retries, err.reason))
            except (urllib.error.URLError, OSError) as err:
                print('[eva-ioni] network error (attempt %d/%d): %s' % (
                    attempt, max_retries, err))
            if not delivered:
                time.sleep(delay)
                delay = min(delay * 2, 60.0)
        if once:
            print('[eva-ioni] single-shot complete')
            break
        time.sleep(interval)


if __name__ == '__main__':
    run()

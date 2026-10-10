#!/bin/sh
# Healthcheck script for MyZubster Federation Node Pilot
# Used to provide evidence for Milestone 2

set -e

# 1. Check if the process is running
if ! pgrep -x "myzubster-core" > /dev/null; then
  echo "CRITICAL: Process not running"
  exit 1
fi

# 2. Check API responsiveness
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health || echo "000")
if [ "$STATUS" != "200" ]; then
  echo "CRITICAL: API Health endpoint returned $STATUS"
  exit 1
fi

# 3. Check disk space for data persistence
USAGE=$(df /app/data | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$USAGE" -gt 90 ]; then
  echo "WARNING: Disk usage high ($USAGE%)"
  # We don't exit 1 here to allow the node to stay up, but logs will show it
fi

echo "OK: Node is healthy"
exit 0

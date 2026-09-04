#!/bin/sh
set -eu

[ "${ONION_TELEMETRY_ENABLED:-false}" = "true" ] || exit 0

ENDPOINT=${ONION_TELEMETRY_ENDPOINT:-https://myzubster.com/api/telemetry/onion/heartbeat}
STATE_DIR=${ONION_TELEMETRY_STATE_DIR:-/var/lib/myzubster-telemetry}
STATE_FILE="$STATE_DIR/bucket"
ROTATE_SECONDS=86400
INTERVAL_SECONDS=${ONION_TELEMETRY_INTERVAL_SECONDS:-3600}
RELEASE=${MYZUBSTER_RELEASE:-unknown}

mkdir -p "$STATE_DIR"
chmod 700 "$STATE_DIR"

new_bucket() {
  openssl rand -hex 16
}

ensure_bucket() {
  now=$(date +%s)
  bucket=""
  created=0
  if [ -f "$STATE_FILE" ]; then
    IFS=' ' read -r bucket created < "$STATE_FILE" || true
  fi
  case "$created" in ''|*[!0-9]*) created=0 ;; esac
  if [ -z "$bucket" ] || [ $((now - created)) -ge "$ROTATE_SECONDS" ]; then
    bucket=$(new_bucket)
    printf '%s %s\n' "$bucket" "$now" > "$STATE_FILE"
    chmod 600 "$STATE_FILE"
  fi
  printf '%s' "$bucket"
}

while :; do
  bucket=$(ensure_bucket)
  payload=$(printf '{"schema":1,"kind":"onion_instance_heartbeat","release":"%s","runtime":"docker","bucket":"%s"}' "$RELEASE" "$bucket")
  curl --silent --show-error --fail --max-time 10 \
    -H 'Content-Type: application/json' \
    --data "$payload" "$ENDPOINT" >/dev/null 2>&1 || true
  sleep "$INTERVAL_SECONDS"
done

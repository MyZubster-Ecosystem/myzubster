#!/bin/sh
set -eu

INTERVAL="${PROBE_INTERVAL_SECONDS:-30}"
TIMEOUT="${PROBE_TIMEOUT_SECONDS:-15}"
CANDIDATES_FILE="${CANDIDATES_FILE:-/config/candidates.txt}"
OBSERVATIONS_FILE="${OBSERVATIONS_FILE:-/data/observations.jsonl}"
OBSERVER_ID="${OBSERVER_ID:-observer-unknown}"
PROBE_PATH="${PROBE_PATH:-/health}"
TOR_SOCKS="${TOR_SOCKS:-socks5h://127.0.0.1:9050}"

mkdir -p "$(dirname "$OBSERVATIONS_FILE")"

iso_now() { date -u +%Y-%m-%dT%H:%M:%SZ; }

emit() {
  node="$1"; result="$2"; latency="$3"; error_class="$4"
  printf '{"node_id":"%s","observer_id":"%s","observed_at":"%s","result":"%s","latency_ms":%s,"error_class":%s}\n' \
    "$node" "$OBSERVER_ID" "$(iso_now)" "$result" "$latency" "$error_class" >> "$OBSERVATIONS_FILE"
}

probe() {
  node="$1"
  start=$(date +%s%3N 2>/dev/null || date +%s000)
  if code=$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
      --max-time "$TIMEOUT" --connect-timeout "$TIMEOUT" \
      --socks5-hostname "${TOR_SOCKS#socks5h://}" \
      "http://${node}${PROBE_PATH}" 2>/tmp/probe.err); then
    end=$(date +%s%3N 2>/dev/null || date +%s000)
    latency=$((end-start))
    case "$code" in
      2*|3*) emit "$node" success "$latency" null ;;
      *) emit "$node" application_error "$latency" '"application_error"' ;;
    esac
  else
    end=$(date +%s%3N 2>/dev/null || date +%s000)
    latency=$((end-start))
    if grep -qiE 'Could not resolve|proxy|timed out|Connection' /tmp/probe.err; then
      emit "$node" onion_connect "$latency" '"onion_connect"'
    else
      emit "$node" tor_connectivity "$latency" '"tor_connectivity"'
    fi
  fi
}

while :; do
  if [ -f "$CANDIDATES_FILE" ]; then
    while IFS= read -r node || [ -n "$node" ]; do
      case "$node" in
        ''|'#'*) continue ;;
        *.onion) probe "$node" ;;
      esac
    done < "$CANDIDATES_FILE"
  fi
  sleep "$INTERVAL"
done

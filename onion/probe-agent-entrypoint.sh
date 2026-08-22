#!/bin/sh
set -eu

TOR_DATA_DIR="${TOR_DATA_DIR:-/var/lib/tor/probe}"
TORRC="/run/myzubster-probe-torrc"

mkdir -p "$TOR_DATA_DIR" /data
chown -R debian-tor:debian-tor "$TOR_DATA_DIR" /data
chmod 700 "$TOR_DATA_DIR"

rm -f "$TORRC"

cat > "$TORRC" <<'TORRC_EOF'
DataDirectory /var/lib/tor/probe
SocksPort 127.0.0.1:9050
Log notice stdout
TORRC_EOF

chmod 644 "$TORRC"

echo "Starting probe Tor client..."

su -s /bin/sh -c \
  "exec tor -f '$TORRC'" \
  debian-tor &

TOR_PID=$!

cleanup() {
    kill "$TOR_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

echo "Waiting for Tor bootstrap..."
sleep 10

if ! kill -0 "$TOR_PID" 2>/dev/null; then
    echo "ERROR: probe Tor process exited" >&2
    exit 1
fi

echo "Starting MyZubster Onion probe agent..."

exec su -s /bin/sh -c \
  "exec /usr/local/bin/myzubster-onion-probe" \
  debian-tor

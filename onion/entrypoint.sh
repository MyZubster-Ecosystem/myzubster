#!/bin/sh
set -eu

DATA_DIR=/var/lib/tor/myzubster
CONFIG_DIR=/etc/tor
TORRC=/etc/tor/torrc

mkdir -p "$DATA_DIR"
chown -R debian-tor:debian-tor "$DATA_DIR"
chmod 700 "$DATA_DIR"

cat > "$TORRC" <<EOF
DataDirectory /var/lib/tor
SocksPort 0
Log notice stdout
HiddenServiceDir $DATA_DIR
HiddenServicePort 80 ${ONION_TARGET_HOST:-frontend}:${ONION_TARGET_PORT:-3000}
EOF

# Keep the Onion identity in the persistent volume. Never print the private key.
if [ -f "$DATA_DIR/hostname" ]; then
  echo "Onion service identity found."
else
  echo "Creating Onion service identity..."
fi

# Telemetry is strictly opt-in and is non-fatal. It never reads the Tor identity.
if [ "${ONION_TELEMETRY_ENABLED:-false}" = "true" ]; then
  /usr/local/bin/myzubster-onion-telemetry &
fi

echo "Starting Tor Onion Service..."
exec tor -f "$TORRC"

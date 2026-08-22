#!/bin/sh
set -eu

DATA_DIR="${ONION_DATA_DIR:-/var/lib/tor/myzubster}"
TARGET_HOST="${ONION_TARGET_HOST:-host.docker.internal}"
TARGET_PORT="${ONION_TARGET_PORT:-5003}"

mkdir -p "$DATA_DIR"
chown -R debian-tor:debian-tor "$DATA_DIR"
chmod 700 "$DATA_DIR"

TARGET_IP="$(getent ahostsv4 "$TARGET_HOST" | awk 'NR==1 {print $1}')"

if [ -z "$TARGET_IP" ]; then
    echo "ERROR: cannot resolve ONION_TARGET_HOST=$TARGET_HOST" >&2
    exit 1
fi

echo "Onion target resolved: $TARGET_HOST -> $TARGET_IP:$TARGET_PORT"
echo "Starting Tor Onion Service..."

cat > /tmp/torrc <<TORRC
DataDirectory /var/lib/tor
SocksPort 0
Log notice stdout
HiddenServiceDir $DATA_DIR
HiddenServicePort 80 $TARGET_IP:$TARGET_PORT
TORRC

exec su -s /bin/sh -c "exec tor -f /tmp/torrc" debian-tor

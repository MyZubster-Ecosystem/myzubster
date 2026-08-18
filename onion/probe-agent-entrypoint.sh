#!/bin/sh
set -eu

TOR_DIR=/var/lib/tor/probe
TORRC=/tmp/probe-torrc

cat > "$TORRC" <<EOF
DataDirectory $TOR_DIR
SocksPort 9050
SocksPolicy accept 127.0.0.1
SocksPolicy reject *
Log notice stdout
EOF

chown debian-tor:debian-tor "$TORRC"
chmod 600 "$TORRC"

tor -f "$TORRC" --RunAsDaemon 1

# Wait for the local SOCKS listener before starting probes.
i=0
while ! (exec 3<>/dev/tcp/127.0.0.1/9050) 2>/dev/null; do
  i=$((i+1))
  [ "$i" -ge 60 ] && echo 'Tor SOCKS listener did not become ready' >&2 && exit 1
  sleep 1
done
exec /usr/local/bin/myzubster-onion-probe

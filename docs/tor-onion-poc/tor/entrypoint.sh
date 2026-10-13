#!/bin/sh
set -e

mkdir -p /var/lib/tor/hidden_service
chown -R tor:tor /var/lib/tor
chmod 700 /var/lib/tor/hidden_service

if [ -f /var/lib/tor/hidden_service/hs_ed25519_secret_key ]; then
    chmod 600 /var/lib/tor/hidden_service/hs_ed25519_secret_key
fi

exec su-exec tor tor -f /etc/tor/torrc "$@"

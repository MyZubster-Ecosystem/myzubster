#!/bin/sh
set -eu

HOSTNAME_FILE=/var/lib/tor/myzubster/hostname

# The health check intentionally validates only local service state.
# It never prints the Onion private key.
if [ -s "$HOSTNAME_FILE" ]; then
  exit 0
fi

exit 1

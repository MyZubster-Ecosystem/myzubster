FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl tor \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/lib/tor/probe /run/tor \
    && chown -R debian-tor:debian-tor /var/lib/tor/probe /run/tor

COPY probe-agent.sh /usr/local/bin/myzubster-onion-probe
COPY probe-agent-entrypoint.sh /usr/local/bin/myzubster-onion-probe-entrypoint
RUN chmod 0755 /usr/local/bin/myzubster-onion-probe /usr/local/bin/myzubster-onion-probe-entrypoint

ENTRYPOINT ["/usr/local/bin/myzubster-onion-probe-entrypoint"]

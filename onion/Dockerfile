FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends tor ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/lib/tor/myzubster \
    && chown -R debian-tor:debian-tor /var/lib/tor/myzubster

COPY entrypoint.sh /usr/local/bin/myzubster-onion-entrypoint
COPY healthcheck.sh /usr/local/bin/myzubster-onion-healthcheck
RUN chmod 0755 /usr/local/bin/myzubster-onion-entrypoint /usr/local/bin/myzubster-onion-healthcheck

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["/usr/local/bin/myzubster-onion-healthcheck"]

ENTRYPOINT ["/usr/local/bin/myzubster-onion-entrypoint"]

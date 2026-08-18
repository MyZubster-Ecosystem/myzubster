FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends tor ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /var/lib/tor/myzubster \
    && chown -R debian-tor:debian-tor /var/lib/tor/myzubster

COPY entrypoint.sh /usr/local/bin/myzubster-onion-entrypoint
RUN chmod +x /usr/local/bin/myzubster-onion-entrypoint

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/myzubster-onion-entrypoint"]

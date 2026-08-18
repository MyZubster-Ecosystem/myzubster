FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

COPY probe-agent.sh /usr/local/bin/myzubster-onion-probe
RUN chmod 0755 /usr/local/bin/myzubster-onion-probe

USER 65532:65532
ENTRYPOINT ["/usr/local/bin/myzubster-onion-probe"]

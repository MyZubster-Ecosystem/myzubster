const { io } = require("socket.io-client");

function boundedInteger(value, fallback, minimum, maximum) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.floor(parsed), minimum), maximum);
}

function percentile(values, ratio) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[
    Math.min(Math.ceil(sorted.length * ratio) - 1, sorted.length - 1)
  ];
}

function connect(url, token, timeoutMs) {
  return new Promise((resolve) => {
    const started = Date.now();
    const socket = io(url, {
      path: "/realtime",
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
      forceNew: true,
      timeout: timeoutMs,
    });
    const timer = setTimeout(() => {
      socket.close();
      resolve({
        ok: false,
        durationMs: Date.now() - started,
        error: "connection_timeout",
      });
    }, timeoutMs + 1000);
    socket.once("connect", () => {
      clearTimeout(timer);
      resolve({ ok: true, durationMs: Date.now() - started, socket });
    });
    socket.once("connect_error", (error) => {
      clearTimeout(timer);
      socket.close();
      resolve({
        ok: false,
        durationMs: Date.now() - started,
        error: error?.message || "connection_error",
      });
    });
  });
}

function emitWithAck(socket, event, payload, timeoutMs) {
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setTimeout(
      () =>
        resolve({
          ok: false,
          durationMs: Date.now() - started,
          error: "ack_timeout",
        }),
      timeoutMs,
    );
    socket.emit(event, payload, (response = {}) => {
      clearTimeout(timer);
      resolve({ ...response, durationMs: Date.now() - started });
    });
  });
}

async function fetchServerMetrics(baseUrl, accessToken) {
  if (!accessToken) return null;
  const response = await fetch(
    `${baseUrl.replace(/\/$/, "")}/api/realtime/metrics`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok) return { error: `metrics_http_${response.status}` };
  return response.json();
}

async function main() {
  const baseUrl = process.env.REALTIME_LOAD_BASE_URL || "http://127.0.0.1:3009";
  const tokens = String(
    process.env.REALTIME_LOAD_SOCKET_TOKENS ||
      process.env.REALTIME_LOAD_SOCKET_TOKEN ||
      "",
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (!tokens.length)
    throw new Error(
      "Set REALTIME_LOAD_SOCKET_TOKEN or REALTIME_LOAD_SOCKET_TOKENS",
    );

  const connections = boundedInteger(
    process.env.REALTIME_LOAD_CONNECTIONS,
    25,
    1,
    500,
  );
  const messagesPerConnection = boundedInteger(
    process.env.REALTIME_LOAD_MESSAGES_PER_CONNECTION,
    0,
    0,
    100,
  );
  const timeoutMs = boundedInteger(
    process.env.REALTIME_LOAD_TIMEOUT_MS,
    10000,
    1000,
    60000,
  );
  const channelId = String(process.env.REALTIME_LOAD_CHANNEL_ID || "").trim();
  if (messagesPerConnection > 0 && !channelId)
    throw new Error("Set REALTIME_LOAD_CHANNEL_ID when sending messages");

  const connected = await Promise.all(
    Array.from({ length: connections }, (_, index) =>
      connect(baseUrl, tokens[index % tokens.length], timeoutMs),
    ),
  );
  const sockets = connected
    .filter((result) => result.ok)
    .map((result) => result.socket);
  const resumes = await Promise.all(
    sockets.map((socket) =>
      emitWithAck(socket, "realtime.resume", { channels: [] }, timeoutMs),
    ),
  );

  const messages =
    messagesPerConnection > 0
      ? await Promise.all(
          sockets.flatMap((socket, socketIndex) =>
            Array.from({ length: messagesPerConnection }, (_, messageIndex) =>
              emitWithAck(
                socket,
                "chat.send",
                {
                  channelId,
                  clientMessageId: `load-${Date.now()}-${socketIndex}-${messageIndex}`,
                  body: "synthetic-load-message",
                },
                timeoutMs,
              ),
            ),
          ),
        )
      : [];

  const serverMetrics = await fetchServerMetrics(
    baseUrl,
    process.env.REALTIME_LOAD_ADMIN_ACCESS_TOKEN,
  ).catch((error) => ({ error: error?.name || "metrics_unavailable" }));
  const result = {
    baseline: "socket-io-live",
    generatedAt: new Date().toISOString(),
    target: baseUrl,
    requestedConnections: connections,
    successfulConnections: sockets.length,
    connectionSuccessRatio: Number((sockets.length / connections).toFixed(6)),
    connectionLatencyMs: {
      p50: percentile(
        connected.map((item) => item.durationMs),
        0.5,
      ),
      p95: percentile(
        connected.map((item) => item.durationMs),
        0.95,
      ),
      max: Math.max(...connected.map((item) => item.durationMs)),
    },
    resumeAttempts: resumes.length,
    resumeSuccesses: resumes.filter((item) => item.ok).length,
    messageAttempts: messages.length,
    messageSuccesses: messages.filter((item) => item.ok).length,
    messageLatencyMs: {
      p50: percentile(
        messages.map((item) => item.durationMs),
        0.5,
      ),
      p95: percentile(
        messages.map((item) => item.durationMs),
        0.95,
      ),
      max: messages.length
        ? Math.max(...messages.map((item) => item.durationMs))
        : null,
    },
    errors: [...connected, ...resumes, ...messages]
      .filter((item) => !item.ok)
      .reduce((summary, item) => {
        const key = String(item.error || "unknown");
        summary[key] = (summary[key] || 0) + 1;
        return summary;
      }, {}),
    serverMetrics,
  };

  for (const socket of sockets) socket.close();
  console.log(JSON.stringify(result, null, 2));

  const connectionHealthy = result.connectionSuccessRatio >= 0.995;
  const resumeHealthy =
    !resumes.length || result.resumeSuccesses / resumes.length >= 0.99;
  const messagesHealthy =
    !messages.length || result.messageSuccesses / messages.length >= 0.999;
  if (!connectionHealthy || !resumeHealthy || !messagesHealthy)
    process.exitCode = 2;
}

main().catch((error) => {
  console.error(
    JSON.stringify({
      success: false,
      error: error?.message || "load_test_failed",
    }),
  );
  process.exitCode = 1;
});

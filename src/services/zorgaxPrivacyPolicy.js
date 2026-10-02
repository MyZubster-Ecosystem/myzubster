"use strict";

function privacyPolicy({ privacyMode = "private", externalConsent } = {}) {
  if (!["private", "external"].includes(privacyMode)) {
    throw Object.assign(new Error("Modalità privacy non valida"), {
      status: 400,
    });
  }
  if (privacyMode === "external" && externalConsent !== true) {
    throw Object.assign(
      new Error("Serve il consenso esplicito per usare AI e ricerca esterne"),
      { status: 400 },
    );
  }
  return { privacyMode, externalAllowed: privacyMode === "external" };
}

// Only a literal loopback address: no configurable public gateway, DNS or redirects.
function localOllamaUrl() {
  const url = new URL(
    process.env.ZORGAX_PRIVATE_OLLAMA_URL || "http://127.0.0.1:11434",
  );
  if (
    !["127.0.0.1", "[::1]"].includes(url.hostname) ||
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Zorgax Privato richiede Ollama sullo stesso server");
  }
  return new URL("/api/chat", url).href;
}

module.exports = { privacyPolicy, localOllamaUrl };

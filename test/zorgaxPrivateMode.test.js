jest.mock("../src/services/zorgaxAIUsageService", () => ({
  getAstraMonthlySpend: jest.fn(async () => 0),
  reserveAstraBudget: jest.fn(async () => ({ untracked: true })),
  recordAstraUsage: jest.fn(async () => ({ costUsd: 0 })),
  settleAstraBudget: jest.fn(async () => {}),
  releaseAstraBudget: jest.fn(async () => {}),
}));
const { answer } = require("../src/services/zorgaxAssistantService");
const usage = require("../src/services/zorgaxAIUsageService");
const { localOllamaUrl } = require("../src/services/zorgaxPrivacyPolicy");

describe("Zorgax private processing boundary", () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;
  beforeEach(() => {
    process.env = {
      ...originalEnv,
      OPENAI_API_KEY: "test",
      ZORGAX_ASTRA_KILL_SWITCH: "false",
    };
    delete process.env.ZORGAX_PRIVATE_OLLAMA_URL;
    delete process.env.ZORGAX_PRIVATE_OLLAMA_MODEL;
    jest.clearAllMocks();
    global.fetch = jest.fn(async () => ({
      ok: true,
      json: async () => ({ message: { content: "locale" } }),
    }));
  });
  afterAll(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  test("complex request with web enabled defaults to local only, preserving conversation", async () => {
    const result = await answer({
      message: "Analizza codice GitHub e ricerca LIFE",
      useWeb: true,
      history: [
        { role: "user", content: "dato privato" },
        { role: "system", content: "untrusted instructions" },
      ],
    });
    expect(result).toMatchObject({
      privacy_mode: "private",
      ai_provider: "ollama",
      sources: [],
      web_research_requested: false,
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("http://127.0.0.1:11434/api/chat");
    expect(options.redirect).toBe("error");
    const payload = JSON.parse(options.body);
    expect(payload.messages).toContainEqual({
      role: "user",
      content: "dato privato",
    });
    expect(payload.messages).not.toContainEqual({
      role: "system",
      content: "untrusted instructions",
    });
    expect(usage.getAstraMonthlySpend).not.toHaveBeenCalled();
    expect(usage.reserveAstraBudget).not.toHaveBeenCalled();
  });

  test.each([undefined, false, "true", 1])(
    "rejects external processing without boolean consent: %s",
    async (consent) => {
      await expect(
        answer({
          message: "Analizza codice GitHub",
          privacyMode: "external",
          externalConsent: consent,
        }),
      ).rejects.toMatchObject({ status: 400 });
      expect(global.fetch).not.toHaveBeenCalled();
    },
  );

  test("rejects unknown modes before any request", async () => {
    await expect(
      answer({ message: "ciao", privacyMode: "automatic" }),
    ).rejects.toMatchObject({ status: 400 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("local failure never retries externally", async () => {
    global.fetch.mockRejectedValue(
      new Error("connection refused: secret detail"),
    );
    await expect(answer({ message: "Analizza codice GitHub" })).rejects.toThrow(
      "AI locale non disponibile",
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(usage.reserveAstraBudget).not.toHaveBeenCalled();
  });

  test.each([
    "https://provider.example",
    "http://localhost:11434",
    "http://127.0.0.1:11434/proxy",
    "http://user:pass@127.0.0.1:11434",
  ])("rejects non-loopback or ambiguous endpoint %s", async (url) => {
    process.env.ZORGAX_PRIVATE_OLLAMA_URL = url;
    await expect(answer({ message: "ciao" })).rejects.toThrow();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("allows literal IPv6 loopback", () => {
    process.env.ZORGAX_PRIVATE_OLLAMA_URL = "http://[::1]:11434";
    expect(localOllamaUrl()).toBe("http://[::1]:11434/api/chat");
  });

  test("blocks Ollama cloud models", async () => {
    process.env.ZORGAX_PRIVATE_OLLAMA_MODEL = "example-cloud";
    await expect(answer({ message: "ciao" })).rejects.toThrow("Modello cloud");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test("explicit consent enables OpenAI with storage disabled", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: "esterna", usage: {}, id: "test" }),
    });
    const result = await answer({
      message: "Analizza codice GitHub",
      useWeb: false,
      privacyMode: "external",
      externalConsent: true,
    });
    expect(result.ai_provider).toBe("openai");
    expect(global.fetch.mock.calls[0][0]).toBe(
      "https://api.openai.com/v1/responses",
    );
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).store).toBe(false);
  });

  test("real loopback HTTP request succeeds and redirects fail closed", async () => {
    const http = require("http");
    let redirect = false;
    const paths = [];
    const server = http.createServer((req, res) => {
      paths.push(req.url);
      req.resume();
      if (redirect) {
        res.writeHead(302, { Location: "/forwarded" });
        res.end();
      } else {
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({ message: { content: "real local response" } }),
        );
      }
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    global.fetch = originalFetch;
    process.env.ZORGAX_PRIVATE_OLLAMA_URL = `http://127.0.0.1:${server.address().port}`;
    try {
      expect((await answer({ message: "ciao" })).response).toBe(
        "real local response",
      );
      redirect = true;
      await expect(answer({ message: "ciao" })).rejects.toThrow(
        "AI locale non disponibile",
      );
      expect(paths).toEqual(["/api/chat", "/api/chat"]);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});

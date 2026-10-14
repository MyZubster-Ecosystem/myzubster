import crypto from "node:crypto";
import fs from "node:fs";

const BASE_URL = (
  process.env.MYZUBSTER_NODE_URL ||
  "https://bridge.myzubster.com/open-period-care"
).replace(/\/+$/, "");

const OUTPUT_FILE =
  process.env.OUTPUT_FILE ||
  "/output/evidence-report.json";

function canonicalize(value) {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }

  const result = {};

  for (const key of Object.keys(value).sort()) {
    result[key] = canonicalize(value[key]);
  }

  return result;
}

function sha256(value) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalize(value)), "utf8")
    .digest("hex");
}

async function fetchJson(path) {
  const url = `${BASE_URL}${path}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MyZubster-OPC-Independent-Verifier/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(
      `${url} returned HTTP ${response.status}`
    );
  }

  return {
    url,
    data: await response.json()
  };
}

function withoutField(object, field) {
  const copy = structuredClone(object);
  delete copy[field];
  return copy;
}

function check(name, expected, actual) {
  const passed = expected === actual;

  console.log(
    `${passed ? "PASS" : "FAIL"} | ${name}`
  );

  if (!passed) {
    console.log(`       expected: ${expected}`);
    console.log(`       actual:   ${actual}`);
  }

  return {
    name,
    passed,
    expected,
    actual
  };
}

async function main() {
  console.log("");
  console.log("MyZubster Open Period Care");
  console.log("Independent Node Verification");
  console.log("================================");
  console.log(`Target: ${BASE_URL}`);
  console.log("");

  const checks = [];

  const statusResponse =
    await fetchJson("/api/status");

  console.log(
    `Remote service version: ${statusResponse.data.version}`
  );

  checks.push(
    check(
      "service mode",
      "read-only",
      statusResponse.data.mode
    )
  );

  const manifestResponse =
    await fetchJson("/api/manifest");

  const manifest = manifestResponse.data;

  console.log("");
  console.log(
    `Manifest: ${manifest.schema}`
  );

  console.log(
    `Cards declared: ${manifest.knowledgeCards.length}`
  );

  const expectedManifestHash =
    manifest.manifestSha256;

  const calculatedManifestHash =
    sha256(
      withoutField(
        manifest,
        "manifestSha256"
      )
    );

  checks.push(
    check(
      "manifest SHA-256",
      expectedManifestHash,
      calculatedManifestHash
    )
  );

  for (const entry of manifest.knowledgeCards) {
    console.log("");
    console.log(
      `Verifying ${entry.knowledgeCardId}`
    );

    const cardResponse =
      await fetchJson(
        `/api/cards/${encodeURIComponent(entry.id)}`
      );

    const card = cardResponse.data;

    const calculatedCardHash =
      sha256(card);

    checks.push(
      check(
        `${entry.knowledgeCardId} card SHA-256`,
        entry.cardSha256,
        calculatedCardHash
      )
    );

    const payloadResponse =
      await fetchJson(
        `/api/payload/${encodeURIComponent(
          entry.knowledgeCardId
        )}`
      );

    const payload =
      payloadResponse.data;

    const calculatedPayloadHash =
      sha256(
        withoutField(
          payload,
          "payloadSha256"
        )
      );

    checks.push(
      check(
        `${entry.knowledgeCardId} payload internal SHA-256`,
        payload.payloadSha256,
        calculatedPayloadHash
      )
    );

    checks.push(
      check(
        `${entry.knowledgeCardId} payload vs manifest`,
        entry.payloadSha256,
        payload.payloadSha256
      )
    );

    checks.push(
      check(
        `${entry.knowledgeCardId} evidence state`,
        entry.status,
        payload.evidenceState
      )
    );
  }

  const passed =
    checks.every(item => item.passed);

  const report = {
    schema:
      "myzubster.node.interop-verification.v1",

    testType:
      "INDEPENDENT_READ_ONLY_NODE_VERIFICATION",

    target: BASE_URL,

    verifier: {
      implementation:
        "myzubster-opc-independent-verifier",
      version: "1.0.0",
      runtime: process.version,
      containerized: true
    },

    remote: {
      nodeId: manifest.nodeId,
      serviceVersion:
        manifest.serviceVersion,
      manifestSha256:
        manifest.manifestSha256
    },

    result:
      passed ? "PASS" : "FAIL",

    checks,

    testedAt:
      new Date().toISOString()
  };

  fs.mkdirSync(
    "/output",
    { recursive: true }
  );

  fs.writeFileSync(
    OUTPUT_FILE,
    JSON.stringify(report, null, 2)
  );

  console.log("");
  console.log("================================");

  if (passed) {
    console.log(
      "PASS — independent interoperability verified"
    );
  } else {
    console.log(
      "FAIL — one or more verification checks failed"
    );
  }

  console.log(
    `Report: ${OUTPUT_FILE}`
  );

  if (!passed) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error("");
  console.error("FATAL:", error.message);
  process.exitCode = 1;
});

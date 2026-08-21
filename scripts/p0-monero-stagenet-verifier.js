'use strict';

const express = require('express');
const mongoose = require('mongoose');
const { createMoneroWalletRpcClient } = require('../src/services/moneroWalletRpcClient');
const { MongoMoneroSubmissionStore } = require('../src/services/mongoMoneroSubmissionStore');
const { createMoneroTxProofVerifier } = require('../src/services/moneroTxProofVerifier');

async function main() {
  const mongoUri = process.env.P0_MONERO_EVIDENCE_MONGODB_URI;
  const rpcUrl = process.env.P0_MONERO_STAGENET_VERIFIER_RPC_URL;
  if (!mongoUri) throw new Error('P0_MONERO_EVIDENCE_MONGODB_URI is required');
  if (!rpcUrl) throw new Error('P0_MONERO_STAGENET_VERIFIER_RPC_URL is required');

  const port = Number(process.env.P0_MONERO_VERIFIER_PORT || 8787);
  const host = process.env.P0_MONERO_VERIFIER_HOST || '127.0.0.1';
  const bearerToken = process.env.P0_MONERO_VERIFIER_BEARER_TOKEN || null;
  const minConfirmations = Number(process.env.P0_MONERO_MIN_CONFIRMATIONS || 1);
  const dbName = process.env.P0_MONERO_EVIDENCE_DB || 'myzubster_p0_monero_evidence';

  await mongoose.connect(mongoUri, { dbName });
  const submissionStore = new MongoMoneroSubmissionStore();
  const verifierRpc = createMoneroWalletRpcClient({ url: rpcUrl });
  const verifier = createMoneroTxProofVerifier({ verifierRpc, submissionStore, minConfirmations });

  const app = express();
  app.use(express.json({ limit: '64kb' }));
  app.post('/verify', async (req, res) => {
    if (bearerToken && req.get('authorization') !== `Bearer ${bearerToken}`) {
      return res.status(401).json({ valid: false, reason: 'unauthorized' });
    }
    try {
      return res.json(await verifier.verify(req.body));
    } catch (error) {
      return res.status(500).json({ valid: false, reason: error.message });
    }
  });

  const server = app.listen(port, host, () => {
    console.log(`P0 Monero stagenet verifier listening on http://${host}:${port}/verify`);
  });

  async function shutdown() {
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});

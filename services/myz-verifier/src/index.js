const express = require('express');
const { verifyMyzPayment } = require('./verifier');

const app = express();
const port = Number(process.env.PORT || 8787);

app.disable('x-powered-by');
app.use(express.json({ limit: '16kb' }));

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, service: 'myz-independent-verifier' });
});

app.post('/verify', async (req, res) => {
  try {
    const result = await verifyMyzPayment({
      txid: req.body && req.body.txid,
      recipient: req.body && req.body.recipient,
      asset: req.body && req.body.asset,
      network: req.body && req.body.network,
      amount: req.body && req.body.amount,
    });

    res.status(result.verified ? 200 : 422).json(result);
  } catch (error) {
    res.status(503).json({ verified: false, reason: 'verifier unavailable' });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`MYZ independent verifier listening on ${port}`);
  });
}

module.exports = app;

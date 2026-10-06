const express = require('express');
const { verifyBitcoinTestnetPayment, verifyEthereumSepoliaPayment } = require('../services/marketplaceChainVerifiers');
const router = express.Router();

router.post('/btc-testnet', async (req, res) => {
  try {
    const { txid, expectedAddress, expectedAmountBtc, minConfirmations = 1 } = req.body || {};
    if (!txid || !expectedAddress || !(Number(expectedAmountBtc) > 0)) return res.status(400).json({ success:false, code:'INVALID_VERIFICATION_REQUEST' });
    const evidence = await verifyBitcoinTestnetPayment({ txid, expectedAddress, expectedAmountBtc, minConfirmations:Math.max(1, Number(minConfirmations) || 1) });
    res.status(evidence.verified ? 200 : 409).json({ success:evidence.verified, asset:'BTC', mainnet:false, evidence });
  } catch (error) {
    res.status(503).json({ success:false, asset:'BTC', mainnet:false, code:'BTC_VERIFIER_UNAVAILABLE', message:error.message });
  }
});

router.post('/eth-sepolia', async (req, res) => {
  try {
    const { txHash, expectedAddress, expectedAmountWei, minConfirmations = 1 } = req.body || {};
    if (!txHash || !expectedAddress || !/^\d+$/.test(String(expectedAmountWei || '')) || BigInt(String(expectedAmountWei || '0')) <= 0n) return res.status(400).json({ success:false, code:'INVALID_VERIFICATION_REQUEST' });
    const evidence = await verifyEthereumSepoliaPayment({ txHash, expectedAddress, expectedAmountWei, minConfirmations:Math.max(1, Number(minConfirmations) || 1) });
    res.status(evidence.verified ? 200 : 409).json({ success:evidence.verified, asset:'ETH', mainnet:false, evidence });
  } catch (error) {
    res.status(503).json({ success:false, asset:'ETH', mainnet:false, code:'ETH_VERIFIER_UNAVAILABLE', message:error.message });
  }
});

module.exports = router;

const express = require('express');
const { JsonRpcProvider, toUtf8String, Interface, getAddress } = require('ethers');

const router = express.Router();

const EXPECTED_CHAIN_ID = 84532n;
const RPC_URL = process.env.MARKETPLACE_BASE_RPC_URL || process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
const HASH = '39ab3a177734b5e3e254657cfe6015100644bcda2fb008cf2561d000669b9e14';
const PAYLOAD = `MZ-KNOWLEDGE-V1:${HASH}`;
const EVIDENCE_SINK = '0x000000000000000000000000000000000000dead';
const REDEEM_IFACE = new Interface([
  'function redeemDelegations(bytes[] _permissionContexts, bytes32[] _modes, bytes[] _executionCallDatas)'
]);
const SIMPLE_SINGLE_DEFAULT = '0x' + '00'.repeat(32);

function utf8Hex(value) {
  return '0x' + Buffer.from(value, 'utf8').toString('hex');
}

function decodePackedSingle(executionHex) {
  const raw = String(executionHex || '').replace(/^0x/, '');
  if (raw.length < (20 + 32) * 2) return null;
  const target = getAddress('0x' + raw.slice(0, 40));
  const value = BigInt('0x' + raw.slice(40, 104));
  const callData = '0x' + raw.slice(104);
  return { target, value, callData };
}

function inspectDelegatedAnchor(dataHex) {
  try {
    if (!String(dataHex || '').startsWith(REDEEM_IFACE.getFunction('redeemDelegations').selector)) {
      return { recognized: false, match: false };
    }
    const decoded = REDEEM_IFACE.decodeFunctionData('redeemDelegations', dataHex);
    const modes = Array.from(decoded._modes || decoded[1] || []);
    const executionCallDatas = Array.from(decoded._executionCallDatas || decoded[2] || []);
    const executions = executionCallDatas.map((executionHex, index) => {
      const single = decodePackedSingle(executionHex);
      const mode = String(modes[index] || '').toLowerCase();
      if (!single) return { index, mode, decodable: false, match: false };
      const targetMatch = single.target.toLowerCase() === EVIDENCE_SINK;
      const valueMatch = single.value === 0n;
      const calldataMatch = single.callData.toLowerCase() === utf8Hex(PAYLOAD).toLowerCase();
      const modeMatch = mode === SIMPLE_SINGLE_DEFAULT;
      return {
        index,
        mode,
        decodable: true,
        target: single.target,
        valueWei: single.value.toString(),
        callDataHex: single.callData,
        targetMatch,
        valueMatch,
        calldataMatch,
        modeMatch,
        match: targetMatch && valueMatch && calldataMatch && modeMatch
      };
    });
    return {
      recognized: true,
      match: executions.some(item => item.match),
      function: 'redeemDelegations',
      executions
    };
  } catch (error) {
    return { recognized: true, match: false, error: error.message };
  }
}

router.get('/n4k48/:txId', async (req, res) => {
  const txId = String(req.params.txId || '').trim();
  if (!/^0x[0-9a-f]{64}$/i.test(txId)) {
    return res.status(400).json({ success: false, error: 'Invalid transaction hash' });
  }

  try {
    const provider = new JsonRpcProvider(RPC_URL, Number(EXPECTED_CHAIN_ID), { staticNetwork: true });
    const network = await provider.getNetwork();
    if (network.chainId !== EXPECTED_CHAIN_ID) {
      throw new Error(`Unexpected chain id: ${network.chainId}`);
    }

    const [tx, receipt] = await Promise.all([
      provider.getTransaction(txId),
      provider.getTransactionReceipt(txId)
    ]);
    if (!tx || !receipt) {
      return res.status(404).json({ success: false, error: 'Transaction or receipt not found' });
    }

    let decodedData = null;
    try { decodedData = toUtf8String(tx.data); } catch (_) {}

    const block = await provider.getBlock(receipt.blockNumber);
    const direct = {
      evidenceSink: String(tx.to || '').toLowerCase() === EVIDENCE_SINK,
      exactCalldata: decodedData === PAYLOAD
    };
    const delegated = inspectDelegatedAnchor(tx.data);

    const checks = {
      chainId: network.chainId === EXPECTED_CHAIN_ID,
      receiptSuccess: receipt.status === 1,
      zeroTopLevelValue: tx.value === 0n,
      anchorExecution: (direct.evidenceSink && direct.exactCalldata) || delegated.match
    };
    const match = Object.values(checks).every(Boolean);

    return res.status(match ? 200 : 409).json({
      success: match,
      status: match ? 'MATCH' : 'MISMATCH',
      schema: 'myzubster.knowledge-transfer.v1',
      transferId: 'KNOWLEDGE-N4K48-2026-09-18-001',
      commitment: {
        algorithm: 'SHA-256',
        hash: HASH,
        payload: PAYLOAD,
        payloadHex: utf8Hex(PAYLOAD)
      },
      transaction: {
        txId: tx.hash,
        network: 'base-sepolia',
        chainId: Number(network.chainId),
        blockNumber: receipt.blockNumber,
        confirmedAt: block?.timestamp ? new Date(Number(block.timestamp) * 1000).toISOString() : null,
        from: tx.from,
        to: tx.to,
        valueWei: tx.value.toString(),
        dataHex: tx.data,
        type: tx.type
      },
      direct,
      delegated,
      checks
    });
  } catch (error) {
    console.error('Knowledge anchor verification failed', error);
    return res.status(502).json({ success: false, error: error.message || 'Verification failed' });
  }
});

module.exports = router;

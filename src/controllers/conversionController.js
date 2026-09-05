const axios = require('axios');

// Tasso di cambio (da variabile d'ambiente)
const EXCHANGE_RATE = parseFloat(process.env.MYZ_TO_XMR_RATE) || 0.001; // 1 MYZ = 0.001 XMR

// Simulation and real-value transfer are both explicit. Real XMR transfer is disabled unless
// ALLOW_REAL_XMR_CONVERSION=true, preventing an unset SIMULATE_XMR from silently becoming live.
const SIMULATE_XMR = process.env.SIMULATE_XMR === 'true';
const ALLOW_REAL_XMR_CONVERSION = process.env.ALLOW_REAL_XMR_CONVERSION === 'true';
const DEFAULT_WALLET = process.env.DEFAULT_WALLET_ADDRESS || '';

// Database utenti (condiviso con githubWebhookController)
const users = {
  'DanielIoni-creator': { walletAddress: DEFAULT_WALLET, myzBalance: 100 }
};

// Storico conversioni
const conversionHistory = [];

module.exports = {
  // Endpoint per ottenere il tasso di cambio
  getExchangeRate: (req, res) => {
    res.json({
      success: true,
      rate: EXCHANGE_RATE,
      myzToXmr: `1 MYZ = ${EXCHANGE_RATE} XMR`,
      simulated: SIMULATE_XMR,
      liveTransfersEnabled: ALLOW_REAL_XMR_CONVERSION
    });
  },

  // Endpoint per convertire MYZ → XMR
  convertMyzToXmr: async (req, res) => {
    const { githubUsername, amountMYZ } = req.body;

    if (!githubUsername || !amountMYZ) {
      return res.status(400).json({ error: 'Mancano githubUsername o amountMYZ' });
    }

    const user = users[githubUsername];
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }
    if (!user.walletAddress) {
      return res.status(503).json({ error: 'Wallet XMR non configurato' });
    }

    if (user.myzBalance < amountMYZ) {
      return res.status(400).json({ error: 'Saldo MYZ insufficiente' });
    }

    const amountXMR = amountMYZ * EXCHANGE_RATE;
    if (amountXMR <= 0) {
      return res.status(400).json({ error: 'Importo XMR non valido' });
    }

    if (!SIMULATE_XMR && !ALLOW_REAL_XMR_CONVERSION) {
      return res.status(503).json({ error: 'Conversione XMR reale disabilitata' });
    }

    // 1. Sottrai MYZ dal saldo solo dopo avere superato tutti i gate di configurazione.
    user.myzBalance -= amountMYZ;

    let txHash = `sim-tx-${Date.now()}`;
    let simulated = true;

    if (!SIMULATE_XMR) {
      const MONERO_RPC_URL = process.env.MONERO_RPC_URL;
      if (!MONERO_RPC_URL) {
        user.myzBalance += amountMYZ;
        return res.status(503).json({ error: 'MONERO_RPC_URL non configurato' });
      }
      try {
        const response = await axios.post(MONERO_RPC_URL, {
          jsonrpc: '2.0',
          id: '0',
          method: 'transfer',
          params: {
            destinations: [{
              amount: Math.round(amountXMR * 1e12),
              address: user.walletAddress
            }],
            account_index: 0,
            subaddr_indices: [0],
            priority: 0,
            ring_size: 7,
            get_tx_key: true,
            do_not_relay: false
          }
        });

        if (response.data.error) {
          throw new Error(response.data.error.message);
        }

        txHash = response.data.result.tx_hash;
        simulated = false;
      } catch (error) {
        user.myzBalance += amountMYZ;
        return res.status(500).json({
          error: 'Errore durante l\'invio XMR',
          details: error.message
        });
      }
    }

    conversionHistory.push({
      githubUsername,
      amountMYZ,
      amountXMR,
      txHash,
      walletAddress: user.walletAddress,
      convertedAt: new Date().toISOString(),
      simulated
    });

    res.json({
      success: true,
      message: simulated
        ? `[SIMULATO] Convertiti ${amountMYZ} MYZ in ${amountXMR} XMR`
        : `Convertiti ${amountMYZ} MYZ in ${amountXMR} XMR`,
      txHash,
      newBalance: user.myzBalance,
      simulated
    });
  },

  getConversionHistory: (req, res) => {
    res.json({ success: true, count: conversionHistory.length, history: conversionHistory });
  }
};

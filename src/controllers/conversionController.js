const axios = require('axios');

// Tasso di cambio (da variabile d'ambiente)
const EXCHANGE_RATE = parseFloat(process.env.MYZ_TO_XMR_RATE) || 0.001; // 1 MYZ = 0.001 XMR

// Se SIMULATE_XMR è true, salta la chiamata RPC
const SIMULATE_XMR = process.env.SIMULATE_XMR === 'true' || true; // Default true per test

// Database utenti (condiviso con githubWebhookController)
const users = {
  'DanielIoni-creator': { walletAddress: '45M4DW1ug8bdQowWpxucTpgsfjLbVxbYaAra79VewmBobuuhgqTjyD4R3DzpqLM2veiphcB16n24qN1QbLg3y2PYGK3Qkoe', myzBalance: 100 }
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
      simulated: SIMULATE_XMR
    });
  },

  // Endpoint per convertire MYZ → XMR (con simulazione)
  convertMyzToXmr: async (req, res) => {
    const { githubUsername, amountMYZ } = req.body;

    if (!githubUsername || !amountMYZ) {
      return res.status(400).json({ error: 'Mancano githubUsername o amountMYZ' });
    }

    const user = users[githubUsername];
    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    if (user.myzBalance < amountMYZ) {
      return res.status(400).json({ error: 'Saldo MYZ insufficiente' });
    }

    const amountXMR = amountMYZ * EXCHANGE_RATE;
    if (amountXMR <= 0) {
      return res.status(400).json({ error: 'Importo XMR non valido' });
    }

    // 1. Sottrai MYZ dal saldo
    user.myzBalance -= amountMYZ;

    // 2. Se SIMULATE_XMR è true, salta la chiamata RPC
    let txHash = `sim-tx-${Date.now()}`;
    let simulated = true;

    if (!SIMULATE_XMR) {
      // Modalità reale (richiede wallet RPC attivo)
      const MONERO_RPC_URL = process.env.MONERO_RPC_URL || 'http://localhost:18081/json_rpc';
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
        console.log(`✅ Transazione XMR inviata: ${txHash}`);

      } catch (error) {
        // In caso di errore, ripristina il saldo MYZ e restituisci errore
        user.myzBalance += amountMYZ;
        console.error('❌ Errore RPC Monero:', error.message);
        return res.status(500).json({
          error: 'Errore durante l\'invio XMR',
          details: error.message
        });
      }
    } else {
      // Modalità simulata
      console.log(`🔄 [SIMULAZIONE] ${amountMYZ} MYZ → ${amountXMR} XMR per ${githubUsername}`);
    }

    // 3. Registra la conversione
    conversionHistory.push({
      githubUsername,
      amountMYZ,
      amountXMR,
      txHash,
      walletAddress: user.walletAddress,
      convertedAt: new Date().toISOString(),
      simulated
    });

    console.log(`✅ Conversione registrata: ${amountMYZ} MYZ → ${amountXMR} XMR (${simulated ? 'simulata' : 'reale'})`);

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

  // Endpoint per vedere lo storico conversioni
  getConversionHistory: (req, res) => {
    res.json({ success: true, count: conversionHistory.length, history: conversionHistory });
  }
};

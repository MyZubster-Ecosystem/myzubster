const PaymentNotifier = require('./paymentNotifier');
const notifier = new PaymentNotifier();

// Comandi del bot
const commands = {
  '/register': (args) => {
    // /register <address> <issueId> <bounty>
    const [address, issueId, bounty] = args;
    if (!address || !issueId || !bounty) {
      return '❌ Uso: /register <address> <issueId> <bounty>\nEsempio: /register 47T3... 65 0.15';
    }
    
    const wallet = notifier.registerWallet('contributor', address, issueId, bounty);
    return `✅ Wallet registrato per issue #${issueId}!\nAddress: \`${address}\`\nBounty: ${bounty} XMR`;
  },
  
  '/pay': (args) => {
    // /pay <issueId> <bounty> <contributor> <txid> <address>
    const [issueId, bounty, contributor, txid, address] = args;
    if (!issueId || !bounty || !contributor || !txid || !address) {
      return '❌ Uso: /pay <issueId> <bounty> <contributor> <txid> <address>';
    }
    
    const payment = notifier.recordPayment(issueId, bounty, contributor, txid, address);
    return `✅ Pagamento registrato per issue #${issueId}!\nTXID: \`${txid}\``;
  },
  
  '/status': () => {
    return notifier.generateReport();
  },
  
  '/confirm': (args) => {
    // /confirm <txid>
    const [txid] = args;
    if (!txid) {
      return '❌ Uso: /confirm <txid>';
    }
    
    notifier.confirmPayment(txid);
    return `✅ Pagamento confermato: \`${txid}\``;
  }
};

// Processa i comandi
function processCommand(text) {
  const [cmd, ...args] = text.split(' ');
  
  if (commands[cmd]) {
    return commands[cmd](args);
  }
  
  return `❌ Comando non riconosciuto.
Comandi disponibili:
/register <address> <issueId> <bounty>
/pay <issueId> <bounty> <contributor> <txid> <address>
/status
/confirm <txid>`;
}

module.exports = {
  processCommand,
  notifier
};

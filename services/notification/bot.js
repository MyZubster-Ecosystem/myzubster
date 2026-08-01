const PaymentNotifier = require('./paymentNotifier');
const history = require('./history');

const notifier = new PaymentNotifier();

// Carica la storia nel notifier
history.completed.forEach(p => {
  notifier.recordPayment(
    p.issue,
    p.bounty,
    p.contributor,
    p.txid,
    p.address
  );
});

history.pending.forEach(p => {
  notifier.registerWallet(
    p.contributor,
    p.address,
    p.issue,
    p.bounty
  );
});

// Comandi del bot
const commands = {
  '/register': (args) => {
    const [address, issueId, bounty] = args;
    if (!address || !issueId || !bounty) {
      return '❌ Uso: /register <address> <issueId> <bounty>';
    }
    const wallet = notifier.registerWallet('contributor', address, issueId, bounty);
    return `✅ Wallet registrato per issue #${issueId}!\nAddress: \`${address}\`\nBounty: ${bounty} XMR`;
  },
  
  '/pay': (args) => {
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
  
  '/history': () => {
    let msg = '📊 **Storico Pagamenti MyZubster**\n\n';
    
    msg += '✅ **Pagamenti Completati:**\n';
    history.completed.forEach(p => {
      msg += `- #${p.issue}: ${p.bounty} XMR → ${p.contributor} (${p.date})\n`;
    });
    
    msg += '\n⏳ **In Attesa:**\n';
    history.pending.forEach(p => {
      msg += `- #${p.issue}: ${p.bounty} XMR → ${p.contributor}\n`;
    });
    
    msg += '\n🔄 **In Review:**\n';
    history.review.forEach(p => {
      msg += `- #${p.issue}: ${p.bounty} XMR → ${p.contributor}\n`;
    });
    
    return msg;
  },
  
  '/confirm': (args) => {
    const [txid] = args;
    if (!txid) return '❌ Uso: /confirm <txid>';
    notifier.confirmPayment(txid);
    return `✅ Pagamento confermato: \`${txid}\``;
  }
};

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
/history
/confirm <txid>`;
}

module.exports = {
  processCommand,
  notifier
};

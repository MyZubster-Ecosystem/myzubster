/**
 * Payment Notifier - Tracciamento automatico dei pagamenti bounty
 * 
 * Questo modulo notifica via Telegram/Slack quando:
 * - Un pagamento viene inviato
 * - Un pagamento viene ricevuto
 * - Un wallet viene registrato
 */

const axios = require('axios');

class PaymentNotifier {
  constructor(config = {}) {
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN || config.telegramToken;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID || config.telegramChatId;
    this.slackWebhook = process.env.SLACK_WEBHOOK_URL || config.slackWebhook;
    this.payments = [];
    this.wallets = new Map();
  }

  /**
   * Registra un wallet per un contributor
   */
  registerWallet(contributor, address, issueId, bounty) {
    const wallet = {
      contributor,
      address,
      issueId,
      bounty,
      registeredAt: new Date().toISOString(),
      status: 'pending'
    };
    
    this.wallets.set(contributor, wallet);
    
    this.notify(
      `🌱 **Nuovo Wallet Registrato**
      
Contributor: ${contributor}
Issue: #${issueId}
Bounty: ${bounty} XMR
Address: \`${address}\`

Stato: ⏳ In attesa di pagamento`
    );
    
    return wallet;
  }

  /**
   * Registra un pagamento inviato
   */
  recordPayment(issueId, bounty, contributor, txid, address) {
    const payment = {
      issueId,
      bounty,
      contributor,
      txid,
      address,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    
    this.payments.push(payment);
    
    this.notify(
      `✅ **Pagamento Inviato!**

Issue: #${issueId}
Bounty: ${bounty} XMR
Contributor: ${contributor}
TXID: \`${txid}\`
Address: \`${address}\`

Stato: ✅ Pagato`
    );
    
    return payment;
  }

  /**
   * Registra un pagamento ricevuto (conferma)
   */
  confirmPayment(txid) {
    const payment = this.payments.find(p => p.txid === txid);
    if (payment) {
      payment.status = 'confirmed';
      payment.confirmedAt = new Date().toISOString();
      
      this.notify(
        `✅ **Pagamento Confermato!**

TXID: \`${txid}\`
Issue: #${payment.issueId}
Bounty: ${payment.bounty} XMR
Contributor: ${payment.contributor}

Confermato sulla blockchain Monero ✅`
      );
    }
  }

  /**
   * Invia notifica su Telegram/Slack
   */
  async notify(message) {
    // Invia su Telegram
    if (this.telegramToken && this.telegramChatId) {
      try {
        await axios.post(
          `https://api.telegram.org/bot${this.telegramToken}/sendMessage`,
          {
            chat_id: this.telegramChatId,
            text: message,
            parse_mode: 'Markdown'
          }
        );
      } catch (error) {
        console.error('Errore notifica Telegram:', error.message);
      }
    }
    
    // Invia su Slack
    if (this.slackWebhook) {
      try {
        await axios.post(this.slackWebhook, {
          text: message,
          mrkdwn: true
        });
      } catch (error) {
        console.error('Errore notifica Slack:', error.message);
      }
    }
  }

  /**
   * Ottieni lo stato di tutti i pagamenti
   */
  getPaymentStatus() {
    return {
      total: this.payments.length,
      sent: this.payments.filter(p => p.status === 'sent').length,
      confirmed: this.payments.filter(p => p.status === 'confirmed').length,
      pending: this.wallets.size - this.payments.length,
      payments: this.payments,
      wallets: Array.from(this.wallets.values())
    };
  }

  /**
   * Genera un report dei pagamenti
   */
  generateReport() {
    const status = this.getPaymentStatus();
    let report = '📊 **Report Pagamenti MyZubster**\n\n';
    
    report += `📦 Totale Pagamenti: ${status.total}\n`;
    report += `✅ Confermati: ${status.confirmed}\n`;
    report += `⏳ In attesa: ${status.sent - status.confirmed}\n`;
    report += `🌱 Wallet Registrati: ${status.wallets.length}\n\n`;
    
    if (status.payments.length > 0) {
      report += '**Pagamenti Recenti:**\n';
      status.payments.slice(-5).forEach(p => {
        report += `- #${p.issueId}: ${p.bounty} XMR → ${p.contributor} (${p.status})\n`;
      });
    }
    
    if (status.wallets.length > 0) {
      report += '\n**Wallet Registrati:**\n';
      status.wallets.forEach(w => {
        report += `- ${w.contributor}: ${w.bounty} XMR (Issue #${w.issueId})\n`;
      });
    }
    
    return report;
  }
}

module.exports = PaymentNotifier;

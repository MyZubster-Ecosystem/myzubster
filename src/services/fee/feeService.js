/**
 * Fee Service - MyZ 2%
 * Gestisce le commissioni del 2% per il progetto MyZubster
 */

class FeeService {
  constructor() {
    this.feePercent = parseFloat(process.env.MYZ_FEE_PERCENT) || 2;
    this.feeWallet = process.env.MYZ_FEE_WALLET || '0xMyZFeeWalletAddress';
  }

  /**
   * Calcola le fee per un pagamento
   */
  calculateFee(amount) {
    const fee = amount * (this.feePercent / 100);
    const netAmount = amount - fee;
    
    return {
      total: amount,
      fee: fee,
      feePercent: this.feePercent,
      netAmount: netAmount,
      feeWallet: this.feeWallet
    };
  }

  /**
   * Applica la fee a un pagamento
   */
  applyFee(payment) {
    const feeData = this.calculateFee(payment.amount);
    
    return {
      ...payment,
      fee: feeData.fee,
      feePercent: feeData.feePercent,
      netAmount: feeData.netAmount,
      feeWallet: feeData.feeWallet,
      status: 'fee_applied'
    };
  }

  /**
   * Verifica che la fee sia stata applicata
   */
  isFeeApplied(payment) {
    return payment.fee && payment.fee > 0 && payment.feePercent === this.feePercent;
  }
}

module.exports = new FeeService();

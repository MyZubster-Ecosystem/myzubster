/**
 * Boson Protocol x402B Escrow Service
 * Gestisce gli escrow per i pagamenti robot
 */

class BosonEscrowService {
  constructor() {
    this.escrows = new Map();
  }

  /**
   * Crea un escrow per un lavoro
   */
  async createEscrow({ jobId, buyer, seller, amount, terms }) {
    try {
      const escrow = {
        id: `esc_${Date.now()}`,
        jobId,
        buyer,
        seller,
        amount,
        terms: terms || 'Standard terms apply',
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.escrows.set(escrow.id, escrow);
      console.log(`🔒 Escrow creato: ${escrow.id}`);
      return escrow;
    } catch (error) {
      console.error('❌ Errore creazione escrow:', error.message);
      throw error;
    }
  }

  /**
   * Rilascia i fondi dall'escrow
   */
  async releaseFunds(escrowId, signature) {
    try {
      const escrow = this.escrows.get(escrowId);
      if (!escrow) {
        throw new Error('Escrow non trovato');
      }
      
      if (signature !== 'approved') {
        throw new Error('Firma non valida');
      }
      
      escrow.status = 'released';
      escrow.releasedAt = new Date().toISOString();
      escrow.updatedAt = new Date().toISOString();
      
      this.escrows.set(escrowId, escrow);
      console.log(`✅ Fondi rilasciati per escrow: ${escrowId}`);
      return escrow;
    } catch (error) {
      console.error('❌ Errore rilascio fondi:', error.message);
      throw error;
    }
  }

  /**
   * Rifiuta i fondi (refund)
   */
  async refundFunds(escrowId, reason) {
    try {
      const escrow = this.escrows.get(escrowId);
      if (!escrow) {
        throw new Error('Escrow non trovato');
      }
      
      escrow.status = 'refunded';
      escrow.refundReason = reason;
      escrow.updatedAt = new Date().toISOString();
      
      this.escrows.set(escrowId, escrow);
      console.log(`↩️ Fondi rimborsati per escrow: ${escrowId}`);
      return escrow;
    } catch (error) {
      console.error('❌ Errore rimborso fondi:', error.message);
      throw error;
    }
  }

  /**
   * Ottieni lo stato di un escrow
   */
  async getEscrowStatus(escrowId) {
    try {
      const escrow = this.escrows.get(escrowId);
      if (!escrow) {
        throw new Error('Escrow non trovato');
      }
      return escrow;
    } catch (error) {
      console.error('❌ Errore recupero escrow:', error.message);
      throw error;
    }
  }
}

module.exports = new BosonEscrowService();

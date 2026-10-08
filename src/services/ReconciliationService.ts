import { BountyReconciliation, SettlementStatus, IBountyReconciliation } from '../models/BountyReconciliation';

export class ReconciliationService {
  /**
   * Updates the settlement status of a bounty.
   * Enforces Rule #1: Never mark as paid without a verifiable transaction reference.
   */
  async updateSettlementStatus(
    id: string, 
    newStatus: SettlementStatus, 
    updateData: Partial<IBountyReconciliation>
  ): Promise<IBountyReconciliation> {
    
    if (newStatus === SettlementStatus.PAID_VERIFIED) {
      if (!updateData.paymentDetails?.transactionHash) {
        throw new Error("Rule Violation: Cannot mark as PAID_VERIFIED without a transaction hash.");
      }
      if (!updateData.paymentDetails?.amountPaid || updateData.paymentDetails.amountPaid <= 0) {
        throw new Error("Rule Violation: Valid amount must be provided for verified payments.");
      }
    }

    // Rule #3: Check if asset change is being attempted without explicit agreement
    // This logic assumes updateData contains the new asset if changed
    if (updateData.agreedSettlementAsset && updateData.agreedSettlementAsset !== updateData.originalReward?.asset) {
      if (!updateData.isExplicitlyApproved) {
        throw new Error("Rule Violation: Changing settlement asset requires explicit contributor approval.");
      }
    }

    const updated = await BountyReconciliation.findByIdAndUpdate(
      id,
      { ...updateData, settlementStatus: newStatus, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updated) throw new Error("Reconciliation record not found.");
    return updated;
  }

  async getCanonicalReconciliationTable() {
    return await BountyReconciliation.find().sort({ updatedAt: -1 });
  }

  async getDisputedClaims() {
    return await BountyReconciliation.find({ settlementStatus: SettlementStatus.DISPUTED });
  }
}

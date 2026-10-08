import { Schema, model, Document } from 'mongoose';

export enum SettlementStatus {
  UNVERIFIED = 'UNVERIFIED',
  APPROVED_UNPAID = 'APPROVED_UNPAID',
  SETTLEMENT_PENDING = 'SETTLEMENT_PENDING',
  PAID_VERIFIED = 'PAID_VERIFIED',
  DISPUTED = 'DISPUTED'
}

export interface IBountyReconciliation extends Document {
  contributorHandle: string;
  sourceReference: string; // Issue or PR URL/ID
  originalReward: {
    amount: number;
    asset: string; // e.g., 'MYZ', 'XMR', 'BTC'
  };
  acceptanceCriteriaMet: boolean;
  mergeStatus: 'MERGED' | 'OPEN' | 'CLOSED';
  isExplicitlyApproved: boolean;
  settlementStatus: SettlementStatus;
  agreedSettlementAsset: string;
  recipientAddress?: string; // Only after confirmation
  paymentDetails?: {
    transactionHash: string;
    network: string;
    amountPaid: number;
    timestamp: Date;
  };
  verificationEvidence: string; // URL to proof or hash of evidence
  updatedAt: Date;
}

const BountyReconciliationSchema = new Schema<IBountyReconciliation>({
  contributorHandle: { type: String, required: true, index: true },
  sourceReference: { type: String, required: true },
  originalReward: {
    amount: { type: Number, required: true },
    asset: { type: String, required: true }
  },
  acceptanceCriteriaMet: { type: Boolean, default: false },
  mergeStatus: { type: String, enum: ['MERGED', 'OPEN', 'CLOSED'], required: true },
  isExplicitlyApproved: { type: Boolean, default: false },
  settlementStatus: { 
    type: String, 
    enum: Object.values(SettlementStatus), 
    default: SettlementStatus.UNVERIFIED 
  },
  agreedSettlementAsset: { type: String, required: true },
  recipientAddress: { type: String },
  paymentDetails: {
    transactionHash: { type: String },
    network: { type: String },
    amountPaid: { type: Number },
    timestamp: { type: Date }
  },
  verificationEvidence: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

export const BountyReconciliation = model<IBountyReconciliation>('BountyReconciliation', BountyReconciliationSchema);

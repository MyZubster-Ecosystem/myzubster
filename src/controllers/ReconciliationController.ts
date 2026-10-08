import { Request, Response } from 'express';
import { ReconciliationService } from '../services/ReconciliationService';
import { SettlementStatus } from '../models/BountyReconciliation';

const service = new ReconciliationService();

export const reconcileBounty = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, updateData } = req.body;

    if (!Object.values(SettlementStatus).includes(status)) {
      return res.status(400).json({ error: "Invalid settlement status" });
    }

    const result = await service.updateSettlementStatus(id, status as SettlementStatus, updateData);
    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getReconciliationReport = async (_req: Request, res: Response) => {
  try {
    const report = await service.getCanonicalReconciliationTable();
    res.status(200).json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AuditLog from '../models/AuditLog';

export const getAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user?.organizationId;
    const filter: any = {};
    if (orgId && req.user?.role !== 'SUPER_ADMIN') {
      filter.organizationId = orgId;
    }

    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(100);
    return res.json({ logs });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to retrieve audit log entries.' });
  }
};

import { Injectable } from '@nestjs/common';
import AuditLog from '../models/auditlog.schema';

@Injectable()
export class AuditLogService {
  async log({ userId, action, model, documentId, changes, ip }: {
    userId?: string;
    action: string;
    model: string;
    documentId: string;
    changes?: any;
    ip?: string;
  }) {
    await AuditLog.create({
      userId,
      action,
      model,
      documentId,
      changes,
      ip,
    });
  }

  async findLogs({ userId, action, from, to, limit = 100, skip = 0 }: {
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
    limit?: number;
    skip?: number;
  }) {
    const query: any = {};
    if (userId) query.userId = userId;
    if (action) query.action = action;
    if (from || to) {
      query.timestamp = {};
      if (from) query.timestamp.$gte = new Date(from);
      if (to) query.timestamp.$lte = new Date(to);
    }
    return AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
}

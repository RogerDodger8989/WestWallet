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
}

import { Module } from '@nestjs/common';
import { AuditLogService } from './auditlog.service';

@Module({
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
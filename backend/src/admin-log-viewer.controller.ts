import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './common/auditlog.service';

@Controller('admin/logs')
export class AdminLogViewerController {
  constructor(private readonly auditLogService: AuditLogService) {}

  // List audit logs with optional filters (userId, action, date range)
  @Get()
  async getLogs(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit: number = 100,
    @Query('skip') skip: number = 0,
  ) {
    return this.auditLogService.findLogs({ userId, action, from, to, limit, skip });
  }
}

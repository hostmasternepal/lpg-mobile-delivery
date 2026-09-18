import { Module } from '@nestjs/common';
import { AuditLogController } from './audit-log.controller';
import { AuditLogListener } from './audit-log.listener';
import { AuditLogService } from './audit-log.service';

@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService, AuditLogListener],
  exports: [AuditLogService],
})
export class AuditLogModule {}

import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuditLogService } from './audit-log.service';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLog: AuditLogService) {}

  @Get()
  @Permissions('audit-log:read')
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('actorId') actorId?: string,
  ) {
    return this.auditLog.query({ entityType, entityId, actorId }, user.userId);
  }
}

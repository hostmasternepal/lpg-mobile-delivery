import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { DispatchToDistributorDto } from './dto/dispatch-to-distributor.dto';
import { ReceiveWebhookDto } from './dto/receive-webhook.dto';
import { ExternalIntegrationService } from './external-integration.service';

@Controller('integrations')
export class ExternalIntegrationController {
  constructor(private readonly externalIntegration: ExternalIntegrationService) {}

  /**
   * Auth here is the same deny-by-default JWT+RBAC as every other
   * endpoint (permission: integration:receive, held only by the
   * INTEGRATION_SERVICE role — see backend/prisma/seed.ts). The real
   * scheme a live integration partner would use (API key, HMAC-signed
   * webhook, mTLS, ...) is OPEN-BUSINESS-DECISION-21/22/27/28; this is a
   * pragmatic default, not that decision.
   */
  @Post(':sourceChannel/webhook')
  @Permissions('integration:receive')
  receiveWebhook(
    @Param('sourceChannel') sourceChannel: string,
    @Body() dto: ReceiveWebhookDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.externalIntegration.receiveWebhook(sourceChannel, dto.externalReferenceId, dto.payload, user.userId);
  }

  // Ops/troubleshooting visibility — a distinct permission from
  // integration:receive (the service account's submit-only permission),
  // since viewing/reprocessing the inbox is a human operational task,
  // not something an integration partner does.
  @Get('inbox')
  @Permissions('integration:manage')
  listInbox(@Query('status') status?: string) {
    return this.externalIntegration.listInboxEntries(status);
  }

  @Get('inbox/:id')
  @Permissions('integration:manage')
  getInboxEntry(@Param('id') id: string) {
    return this.externalIntegration.getInboxEntry(id);
  }

  @Post('inbox/:id/reprocess')
  @Permissions('integration:manage')
  reprocess(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.externalIntegration.reprocessInboxEntry(id, user.userId);
  }

  @Post('distributor-dispatch')
  @Permissions('delivery:assign')
  dispatchToDistributor(@Body() dto: DispatchToDistributorDto, @CurrentUser() user: AuthenticatedUser) {
    return this.externalIntegration.dispatchToDistributor(dto, user.userId);
  }
}

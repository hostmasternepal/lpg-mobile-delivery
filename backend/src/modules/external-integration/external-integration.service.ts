import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestIntakeService } from '../request-intake/request-intake.service';

@Injectable()
export class ExternalIntegrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestIntake: RequestIntakeService,
  ) {}

  /**
   * ARCH-DECISION-13: stage-then-process. A duplicate
   * (sourceChannel, externalReferenceId) pair is detected by the unique
   * constraint on integration_inbox and marked DUPLICATE — a no-op, not a
   * new request. Per-source payload normalization is not yet implemented.
   */
  async receiveWebhook(_sourceChannel: string, _externalReferenceId: string, _rawPayload: unknown): Promise<never> {
    throw new NotImplementedException('ExternalIntegrationService.receiveWebhook');
  }

  async dispatchToDistributor(): Promise<never> {
    throw new NotImplementedException('ExternalIntegrationService.dispatchToDistributor');
  }
}

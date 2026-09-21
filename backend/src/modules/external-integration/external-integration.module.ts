import { Module } from '@nestjs/common';
import { RequestIntakeModule } from '../request-intake/request-intake.module';
import { ExternalIntegrationController } from './external-integration.controller';
import { ExternalIntegrationService } from './external-integration.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §11, ARCHITECTURE_REVIEW.md
 * §F/CRIT-5): per-source adapters (Hello Sarkar, Call Centre, ...)
 * normalizing inbound payloads into RequestIntake DTOs, staged through
 * integration_inbox for idempotency BEFORE calling
 * RequestIntakeService.createRequest() (ARCH-DECISION-13). No external
 * system's actual field names or auth scheme are asserted anywhere in
 * this codebase — those are OPEN-BUSINESS-DECISION-21/22/25/27-31.
 * GenericPassthroughAdapter (request-source-adapter.ts) is the only
 * IRequestSourceAdapter implementation until a real per-source contract
 * is confirmed; NoopDeliveryDispatchAdapter (delivery-dispatch-
 * adapter.ts) is the only outbound IDeliveryDispatchAdapter for the
 * same reason (OPEN-BUSINESS-DECISION-29).
 */
@Module({
  imports: [RequestIntakeModule],
  controllers: [ExternalIntegrationController],
  providers: [ExternalIntegrationService],
  exports: [ExternalIntegrationService],
})
export class ExternalIntegrationModule {}

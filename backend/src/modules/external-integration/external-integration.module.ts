import { Module } from '@nestjs/common';
import { RequestIntakeModule } from '../request-intake/request-intake.module';
import { ExternalIntegrationService } from './external-integration.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §11, ARCHITECTURE_REVIEW.md
 * §F/CRIT-5): per-source adapters (Hello Sarkar, Call Centre, ...)
 * normalizing inbound payloads into RequestIntake DTOs, staged through
 * integration_inbox for idempotency BEFORE calling
 * RequestIntakeService.createRequest() (ARCH-DECISION-13). No external
 * system's actual field names or auth scheme are asserted anywhere in
 * this codebase — those are OPEN-BUSINESS-DECISION-21/22/25/27-31.
 * Scaffolded, not yet implemented.
 */
@Module({
  imports: [RequestIntakeModule],
  providers: [ExternalIntegrationService],
  exports: [ExternalIntegrationService],
})
export class ExternalIntegrationModule {}

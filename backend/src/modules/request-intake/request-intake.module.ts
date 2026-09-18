import { Module } from '@nestjs/common';
import { RequestIntakeService } from './request-intake.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §2/§7): request CRUD, source
 * tagging, and the SOLE mutator of `requests.status` via
 * RequestStateMachine (ARCH-DECISION-18). Verification,
 * PriorityClassification, and DeliveryPlanning call
 * RequestIntakeService.transition() — they never set the status column
 * themselves.
 *
 * Scaffolded, not yet implemented: createRequest/updateRequest/
 * transition/getRequest bodies are next. See docs/SRS.md REQ-016–018,
 * REQ-038 and OPEN-BUSINESS-DECISION-06/07/12 before writing the state
 * machine's transition table.
 */
@Module({
  providers: [RequestIntakeService],
  exports: [RequestIntakeService],
})
export class RequestIntakeModule {}

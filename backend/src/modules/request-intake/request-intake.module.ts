import { Module } from '@nestjs/common';
import { RequestIntakeController } from './request-intake.controller';
import { RequestIntakeService } from './request-intake.service';

/**
 * Responsibility (docs/ARCHITECTURE.md §2/§7): request CRUD, source
 * tagging, and the SOLE mutator of `requests.status` via the
 * RequestStateMachine table in request-state-machine.ts
 * (ARCH-DECISION-18). Verification, PriorityClassification, and
 * DeliveryPlanning call RequestIntakeService.transition() — they never
 * set the status column themselves.
 *
 * HTTP surface here is CRUD only (POST/GET/PATCH /requests). Status-
 * changing endpoints (verify, shortlist, queue, ...) live in their own
 * owning module's controller and call transition() internally — this
 * module intentionally exposes no generic "set status" endpoint.
 */
@Module({
  controllers: [RequestIntakeController],
  providers: [RequestIntakeService],
  exports: [RequestIntakeService],
})
export class RequestIntakeModule {}

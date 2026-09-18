import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export type DeliveryStopOtpOutcome = 'CONFIRMED' | 'OTP_SEND_FAILED' | 'OTP_VERIFY_FAILED';

@Injectable()
export class DeliveryPlanningService {
  constructor(private readonly prisma: PrismaService) {}

  async generatePlan(): Promise<never> {
    throw new NotImplementedException(
      'DeliveryPlanningService.generatePlan — single transaction, idempotent by plan_date (ARCH-DECISION-15).',
    );
  }

  async assignVehicle(): Promise<never> {
    throw new NotImplementedException('DeliveryPlanningService.assignVehicle');
  }

  async assignStop(): Promise<never> {
    throw new NotImplementedException('DeliveryPlanningService.assignStop');
  }

  async sequenceStops(): Promise<never> {
    // Route order, kept structurally distinct from priority — see
    // OPEN-BUSINESS-DECISION-42 (priority-first vs. route-efficient).
    throw new NotImplementedException('DeliveryPlanningService.sequenceStops');
  }

  async getAgentDeliveries(agentProfileId: string) {
    return this.prisma.deliveryStop.findMany({
      where: { deliveryPlanVehicle: { agentProfileId } },
      orderBy: { sequenceNumber: 'asc' },
    });
  }

  /**
   * ARCH-DECISION-19: sole path to CONFIRMED. Called by the Otp module's
   * successful-verification branch (or its explicit, mandatorily-reasoned
   * manualOverride escape hatch) — never invoked as a generic status
   * setter. Closes docs/ARCHITECTURE_REVIEW.md E-7/HIGH-2.
   */
  async recordOtpOutcome(_deliveryStopId: string, _outcome: DeliveryStopOtpOutcome): Promise<never> {
    throw new NotImplementedException('DeliveryPlanningService.recordOtpOutcome');
  }

  async rescheduleStop(_deliveryStopId: string, _actorId: string): Promise<never> {
    // Creates a NEW delivery_stops row (attempt_number + 1) — ARCH-DECISION-07.
    // Reschedule policy (same-day vs next-day, requeue rank) is
    // OPEN-BUSINESS-DECISION-41.
    throw new NotImplementedException('DeliveryPlanningService.rescheduleStop');
  }
}

import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Legal transitions for `requests.status`. RECORDED -> VERIFIED requires a
 * Verification event; PENDING/REJECTED entry points are intentionally
 * absent until OPEN-BUSINESS-DECISION-07/12 are answered — do not add them
 * speculatively (docs/SRS.md §8 state machine).
 */
export const REQUEST_STATE_TRANSITIONS: Record<string, string[]> = {
  RECORDED: ['VERIFIED'],
  VERIFIED: ['SHORTLISTED'],
  SHORTLISTED: ['DELIVERY_QUEUE'],
  DELIVERY_QUEUE: ['DELIVERY_PLANNED'],
  DELIVERY_PLANNED: ['DELIVERY_IN_PROGRESS'],
  DELIVERY_IN_PROGRESS: ['DELIVERED'],
};

@Injectable()
export class RequestIntakeService {
  constructor(private readonly prisma: PrismaService) {}

  async createRequest(): Promise<never> {
    throw new NotImplementedException(
      'RequestIntakeService.createRequest — implements REQ-016/017/018, next in the build sequence.',
    );
  }

  async updateRequest(): Promise<never> {
    throw new NotImplementedException('RequestIntakeService.updateRequest');
  }

  async getRequest(id: string) {
    return this.prisma.request.findUniqueOrThrow({ where: { id } });
  }

  /**
   * ARCH-DECISION-18: the ONLY method in the system permitted to write
   * requests.status. Uses the row's `version` column for optimistic
   * concurrency (ARCH-DECISION-14, closes review I-2/I-3) — callers must
   * pass the version they last read; a stale version raises a conflict
   * rather than silently overwriting a concurrent transition.
   */
  async transition(_requestId: string, _event: string, _actorId: string, _expectedVersion: number): Promise<never> {
    throw new NotImplementedException(
      'RequestIntakeService.transition — enforces REQUEST_STATE_TRANSITIONS with optimistic-lock guard.',
    );
  }
}

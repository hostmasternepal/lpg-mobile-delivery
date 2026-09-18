import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestIntakeService } from '../request-intake/request-intake.service';

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly requestIntake: RequestIntakeService,
  ) {}

  async recordVerification(): Promise<never> {
    // Implements REQ-019/022. On CONFIRMED outcome, calls
    // requestIntake.transition(requestId, 'VERIFIED', actorId, version) —
    // does not write requests.status directly (docs/ARCHITECTURE.md
    // boundary rule 1). Also where the I-1 duplicate-candidate surfacing
    // (exact mobile_number match) belongs, per docs/ARCHITECTURE_REVIEW.md.
    throw new NotImplementedException('VerificationService.recordVerification');
  }

  async getVerificationHistory(requestId: string) {
    return this.prisma.verification.findMany({ where: { requestId }, orderBy: { verifiedAt: 'desc' } });
  }
}
